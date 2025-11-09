import pool from "../db.js";       
import nodemailer from "nodemailer";

import { sendEmail } from "../config/email.js";

// ----------------- Helpers -----------------

// Email to admin
async function notifyAdmin(order, dataset, customerEmail) {
  await sendEmail({
    to: "admin@example.com", // admin email
    subject: `New Order Received - #${order.order_id}`,
    html: `
      <h3>New Order Received</h3>
      <p><b>Order ID:</b> ${order.order_id}</p>
      <p><b>Dataset:</b> ${dataset.name}</p>
      <p><b>Customer:</b> ${customerEmail}</p>
      <p><b>Amount:</b> ₹${order.amount} + Tax ₹${order.tax}</p>
      <p><b>Status:</b> ${order.payment_status}</p>
    `,
  });
}

// Email to customer with dataset link
async function sendDownloadLink(order) {
  const customerRes = await pool.query(
    "SELECT email FROM customers WHERE customer_id=$1",
    [order.customer_id]
  );
  const email = customerRes.rows[0].email;

  await sendEmail({
    to: email,
    subject: `Your Dataset Order #${order.order_id} - Completed`,
    html: `
      <p>Thank you for your purchase!</p>
      <p><b>Order ID:</b> ${order.order_id}</p>
      <p><b>Status:</b> ${order.payment_status}</p>
      <p>You can download your dataset here: <a href="${order.download_link}">Download</a></p>
    `,
  });
}


export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { datasetId, name, email, phone, paymentMethod } = req.body;

    if (!datasetId || !email || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // (A) Check if customer exists
    let customer = await client.query(
      "SELECT * FROM customers WHERE email=$1",
      [email]
    );

    let customerId;
    if (customer.rows.length === 0) {
      const newCustomer = await client.query(
        `INSERT INTO customers (name, email, phone) 
         VALUES ($1, $2, $3) RETURNING customer_id`,
        [name, email, phone]
      );
      customerId = newCustomer.rows[0].customer_id;
    } else {
      customerId = customer.rows[0].customer_id;
    }

    // (B) Get dataset price
    const datasetRes = await client.query(
      "SELECT * FROM dataset WHERE dataset_id=$1",
      [datasetId]
    );
    if (datasetRes.rows.length === 0) {
      throw new Error("Dataset not found");
    }
    const dataset = datasetRes.rows[0];

    const amount = Number(dataset.price) || 0;
    const tax = (amount * 0.18).toFixed(2); // Example: 18% GST

    // (C) Insert order
    const orderRes = await client.query(
      `INSERT INTO orders 
        (dataset_id, customer_id, amount, tax, payment_method, payment_status) 
       VALUES ($1,$2,$3,$4,$5,'pending') 
       RETURNING *`,
      [datasetId, customerId, amount, tax, paymentMethod]
    );

    const order = orderRes.rows[0];

    await client.query("COMMIT");

    // (D) Notify admin by email
    await notifyAdmin(order, dataset, email);

    // (E) Optional real-time notify via Socket.IO
    // io.emit("new_order", { order_id: order.order_id, customer: name, amount });

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create order" });
  } finally {
    client.release();
  }
};

// 2. Admin updates payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, downloadLink } = req.body; // status = 'completed' | 'failed'

    const result = await pool.query(
      `UPDATE orders 
       SET payment_status=$1, download_link=$2 
       WHERE order_id=$3 RETURNING *`,
      [status, downloadLink || null, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = result.rows[0];

    // Send dataset link to customer only if completed
    if (status === "completed") {
      await sendDownloadLink(order);
    }

    res.json({ message: "Payment status updated", order });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};
