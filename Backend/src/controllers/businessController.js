import pool from "../config/db.js";
import { sendMail } from "../config/mailer.js";

const toNumber = (value) => Number(value || 0);

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const normalizeExtraFields = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

const buildOrderDownloadFilename = (label, orderId) => {
  const sanitized = String(label || `order-${orderId}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${sanitized || `order_${orderId}`}.csv`;
};

export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUser = req.user;
    const {
      datasetId,
      datasetName,
      totalPrice,
      phone,
      company,
      paymentMethod,
      datasetContext,
    } = req.body;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to submit the order request",
      });
    }

    if (!datasetName || totalPrice == null || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "datasetName, totalPrice, and paymentMethod are required",
      });
    }

    await client.query("BEGIN");

    const normalizedContext =
      datasetContext && typeof datasetContext === "object" && !Array.isArray(datasetContext)
        ? datasetContext
        : null;

    let resolvedDatasetId = null;
    if (datasetId) {
      const datasetResult = await client.query(
        `SELECT dataset_id
         FROM dataset
         WHERE dataset_id = $1
         LIMIT 1`,
        [datasetId],
      );

      if (datasetResult.rows.length) {
        resolvedDatasetId = datasetResult.rows[0].dataset_id;
      }
    }

    let customerResult = await client.query(
      `SELECT customer_id, name, email, phone, company
       FROM customers
       WHERE email = $1`,
      [currentUser.email.toLowerCase()],
    );

    if (!customerResult.rows.length) {
      customerResult = await client.query(
        `INSERT INTO customers (user_id, name, email, phone, company)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING customer_id, name, email, phone, company`,
        [currentUser.user_id, currentUser.full_name, currentUser.email.toLowerCase(), phone || null, company || null],
      );
    } else {
      await client.query(
        `UPDATE customers
         SET user_id = COALESCE(user_id, $1),
             name = $2,
             phone = $3,
             company = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $5`,
        [currentUser.user_id, currentUser.full_name, phone || null, company || null, customerResult.rows[0].customer_id],
      );
    }

    const customer = customerResult.rows[0];
    const amount = toNumber(totalPrice);
    const tax = Number((amount * 0.1).toFixed(2));
    const totalAmount = Number((amount + tax).toFixed(2));
    const gateway = paymentMethod === "offline" ? "Manual" : paymentMethod === "upi" ? "UPI" : "Card";
    const paymentStatus = paymentMethod === "offline" ? "pending" : "completed";

    const orderResult = await client.query(
      `INSERT INTO orders (
         dataset_id,
         customer_id,
         user_id,
         amount,
         tax,
         total_amount,
         payment_method,
         payment_status,
         dataset_label,
         dataset_context
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        resolvedDatasetId,
        customer.customer_id,
        currentUser.user_id,
        amount,
        tax,
        totalAmount,
        paymentMethod,
        paymentStatus,
        datasetName,
        normalizedContext ? JSON.stringify(normalizedContext) : null,
      ],
    );

    const order = orderResult.rows[0];
    const fee = Number((totalAmount * 0.03).toFixed(2));
    const netAmount = Number((totalAmount - fee).toFixed(2));

    const transactionResult = await client.query(
      `INSERT INTO transactions (
         order_id,
         amount,
         fee,
         net_amount,
         type,
         status,
         payment_method,
         gateway
       )
       VALUES ($1, $2, $3, $4, 'sale', $5, $6, $7)
       RETURNING *`,
      [order.order_id, totalAmount, fee, netAmount, paymentStatus, paymentMethod, gateway],
    );

    const downloadLink = paymentStatus === "completed" ? `/api/me/orders/${order.order_id}/download` : null;
    await client.query("UPDATE orders SET download_link = $1 WHERE order_id = $2", [
      downloadLink,
      order.order_id,
    ]);

    await client.query("COMMIT");

    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8080,http://localhost:8081";
    const parsedOrigins = frontendOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);
    const appOrigin = parsedOrigins[0] || "http://localhost:8081";
    const privateDownloadUrl = `${appOrigin}/api/me/orders/${order.order_id}/download`;
    const isPendingRequest = paymentStatus === "pending";

    sendMail({
      to: currentUser.email,
      subject: isPendingRequest
        ? `Order request received - ${buildOrderDownloadFilename(datasetName, order.order_id)}`
        : `Your B2B DataHub order ${buildOrderDownloadFilename(datasetName, order.order_id)}`,
      text: isPendingRequest
        ? `Your order request has been received and is pending manual review. We will update you after verification.`
        : `Your order is ready. Download it here: ${privateDownloadUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2 style="margin:0 0 12px">${isPendingRequest ? "Order request received" : "Purchase confirmed"}</h2>
          <p style="margin:0 0 12px">Your dataset order <strong>#${order.order_id}</strong> ${isPendingRequest ? "has been received and is pending manual review." : "is ready."}</p>
          ${
            isPendingRequest
              ? `<p style="margin:0;color:#666">Payment is unavailable right now. We will update you after the request is reviewed.</p>`
              : `<p style="margin:0 0 16px">Download it from your private link below. The link requires your signed-in account.</p>
                 <p><a href="${privateDownloadUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Download Dataset</a></p>
                 <p style="margin-top:16px;color:#666;font-size:12px;word-break:break-all">${privateDownloadUrl}</p>`
          }
        </div>
      `,
    }).catch((mailError) => {
      console.error("Order email error:", mailError);
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        ...order,
        download_link: downloadLink,
        transaction: transactionResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, message: "Failed to create order" });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         o.order_id,
         o.amount,
         o.tax,
         o.total_amount,
         o.payment_method,
         o.payment_status,
         o.dataset_label,
         o.download_link,
         o.created_at,
         c.name AS customer_name,
         c.email AS customer_email,
         COALESCE(t.download_count, 0) AS download_count
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN transactions t ON o.order_id = t.order_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.user_id],
    );

    return res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your orders" });
  }
};

export const getOrders = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         o.order_id,
         o.amount,
         o.tax,
         o.total_amount,
         o.payment_method,
         o.payment_status,
         o.dataset_label,
         o.download_link,
         o.created_at,
         c.name AS customer_name,
         c.email AS customer_email,
         COALESCE(t.download_count, 0) AS download_count
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN transactions t ON o.order_id = t.order_id
       ORDER BY o.created_at DESC`,
    );

    return res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getCustomers = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.customer_id,
         c.name,
         c.email,
         c.phone,
         c.company,
         c.created_at,
         MAX(o.created_at) AS last_order,
         COUNT(o.order_id) AS total_orders,
         COALESCE(SUM(o.total_amount), 0) AS total_spent
       FROM customers c
       LEFT JOIN orders o ON c.customer_id = o.customer_id
       GROUP BY c.customer_id
       ORDER BY MAX(o.created_at) DESC NULLS LAST, c.created_at DESC`,
    );

    const customers = result.rows.map((row) => {
      const totalSpent = toNumber(row.total_spent);
      let status = "inactive";

      if (totalSpent >= 10000) status = "premium";
      else if (Number(row.total_orders) > 0) status = "active";

      return {
        ...row,
        total_orders: Number(row.total_orders),
        total_spent: totalSpent,
        status,
      };
    });

    return res.json({ success: true, customers });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
};

export const getTransactions = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.transaction_id,
         t.order_id,
         t.amount,
         t.fee,
         t.net_amount,
         t.type,
         t.status,
         t.payment_method,
         t.gateway,
         t.created_at,
         c.name AS customer_name
       FROM transactions t
       JOIN orders o ON t.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       ORDER BY t.created_at DESC`,
    );

    return res.json({ success: true, transactions: result.rows });
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

export const downloadMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderResult = await pool.query(
      `SELECT
         o.order_id,
         o.dataset_id,
         o.user_id,
         o.dataset_label,
         o.dataset_context,
         COALESCE(t.download_count, 0) AS download_count
       FROM orders o
       LEFT JOIN transactions t ON o.order_id = t.order_id
       WHERE o.order_id = $1`,
      [orderId],
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderResult.rows[0];
    if (req.user.role !== "admin" && Number(order.user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const context = normalizeExtraFields(order.dataset_context);
    const params = [];
    const filters = [];

    if (context.categoryId) {
      params.push(context.categoryId);
      filters.push(`d.category_id = $${params.length}`);
    }
    if (context.countryId) {
      params.push(context.countryId);
      filters.push(`d.country_id = $${params.length}`);
    }
    if (context.stateId) {
      params.push(context.stateId);
      filters.push(`d.state_id = $${params.length}`);
    }
    if (context.cityId) {
      params.push(context.cityId);
      filters.push(`d.city_id = $${params.length}`);
    }

    if (!filters.length && order.dataset_id) {
      params.push(order.dataset_id);
      filters.push(`d.dataset_id = $${params.length}`);
    }

    if (!filters.length) {
      return res.status(404).json({ success: false, message: "No records available for download" });
    }

    const rowsResult = await pool.query(
      `SELECT
         d.dataset_id,
         d.name,
         d.address,
         d.phone,
         d.email,
         d.price,
         d.extra_fields,
         c.category_name,
         co.country_name,
         s.state_name,
         ci.city_name
       FROM dataset d
       JOIN category c ON d.category_id = c.category_id
       JOIN country co ON d.country_id = co.country_id
       LEFT JOIN state s ON d.state_id = s.state_id
       LEFT JOIN city ci ON d.city_id = ci.city_id
       WHERE ${filters.join(" AND ")}
       ORDER BY d.dataset_id`,
      params,
    );

    const records = rowsResult.rows.map((row) => {
      const extraFields = normalizeExtraFields(row.extra_fields);
      const flattened = {
        dataset_id: row.dataset_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        price: row.price,
        category: row.category_name,
        country: row.country_name,
        state: row.state_name || "",
        city: row.city_name || "",
        ...extraFields,
      };

      delete flattened.extra_fields;
      return flattened;
    });

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No records available for download" });
    }

    const headers = Array.from(
      records.reduce((set, record) => {
        Object.keys(record).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    );

    const csvRows = [
      headers.map(csvEscape).join(","),
      ...records.map((record) =>
        headers.map((header) => csvEscape(record[header] ?? "")).join(","),
      ),
    ];

    await pool.query(
      `UPDATE transactions
       SET download_count = COALESCE(download_count, 0) + 1
       WHERE order_id = $1`,
      [order.order_id],
    );

    const filename = buildOrderDownloadFilename(order.dataset_label, order.order_id);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvRows.join("\n"));
  } catch (error) {
    console.error("Download order error:", error);
    return res.status(500).json({ success: false, message: "Failed to download order data" });
  }
};

export const getAnalyticsSummary = async (_req, res) => {
  try {
    const [ordersResult, transactionsResult, datasetsResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS total_orders,
           COALESCE(SUM(total_amount), 0) AS total_revenue
         FROM orders`,
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total_transactions,
           COALESCE(SUM(fee), 0) AS total_fees,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_transactions
         FROM transactions`,
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total_datasets,
           COALESCE(SUM(CASE WHEN email IS NOT NULL AND email <> '' THEN 1 ELSE 0 END), 0) AS reachable_emails,
           COUNT(*) AS total_records
         FROM dataset`,
      ),
    ]);

    const orderRow = ordersResult.rows[0];
    const transactionRow = transactionsResult.rows[0];
    const datasetRow = datasetsResult.rows[0];

    const totalTransactions = Number(transactionRow.total_transactions);
    const completedTransactions = Number(transactionRow.completed_transactions);
    const totalRecords = Number(datasetRow.total_records);
    const reachableEmails = Number(datasetRow.reachable_emails);

    return res.json({
      success: true,
      analytics: {
        totalRevenue: toNumber(orderRow.total_revenue),
        totalOrders: Number(orderRow.total_orders),
        totalTransactions,
        totalFees: toNumber(transactionRow.total_fees),
        totalDatasets: Number(datasetRow.total_datasets),
        reachableEmails,
        totalRecords,
        successRate: totalTransactions
          ? Number(((completedTransactions / totalTransactions) * 100).toFixed(1))
          : 0,
        conversionRate: totalRecords
          ? Number(((reachableEmails / totalRecords) * 100).toFixed(1))
          : 0,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};
