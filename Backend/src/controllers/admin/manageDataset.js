
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import pool from "../../config/db.js";

const DATASETS_CACHE_TTL_MS = 15000;
const datasetsCache = new Map();

const buildDatasetsCacheKey = (filters) => {
  const payload = {
    category: filters.category || null,
    country: filters.country || null,
    state: filters.state || null,
    city: filters.city || null,
    source: filters.source || null,
  };
  return JSON.stringify(payload);
};

const getCachedDatasets = (filters) => {
  const key = buildDatasetsCacheKey(filters);
  const cached = datasetsCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    datasetsCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedDatasets = (filters, data) => {
  const key = buildDatasetsCacheKey(filters);
  datasetsCache.set(key, {
    data,
    expiresAt: Date.now() + DATASETS_CACHE_TTL_MS,
  });
};

const clearDatasetsCache = () => {
  datasetsCache.clear();
};

export const uploadDataFile = async (req, res) => {
  const client = await pool.connect();
  try {
    const { description, price, category } = req.body;

    const fieldMappings = req.body.fieldMappings
      ? JSON.parse(req.body.fieldMappings)
      : {};
    const customFieldMappings = req.body.customFieldMappings
      ? JSON.parse(req.body.customFieldMappings)
      : [];

    const file = req.files?.["file"]?.[0];
    const proofAttachmentFile = req.files?.["proofAttachment"]?.[0];

    const proofFilePath = proofAttachmentFile
      ? path.relative(process.cwd(), proofAttachmentFile.path)
      : null;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let data = [];

    if (!fs.existsSync(file.path)) {
      return res.status(400).json({ success: false, message: "Uploaded file could not be found on the server" });
    }

    const workbook = XLSX.readFile(file.path, { raw: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!data.length) {
      return res.status(400).json({ success: false, message: "Empty Excel/CSV file" });
    }


    await client.query("BEGIN");

    const sourceResult = await client.query(
      `INSERT INTO dataset_source (source_name, description, proof_attachment) 
       VALUES ($1, $2, $3) 
       RETURNING source_id`,
      [file.originalname, description, proofFilePath]
    );
    const sourceId = sourceResult.rows[0].source_id;


    let summary = { added: 0, updated: 0, unchanged: 0 };

    for (const row of data) {
      // Take category from req.body first, then fallback to row data using mapping
      const categoryValue = category || row[fieldMappings.category] || row.category || "Default Category";
      const countryValue = row[fieldMappings.country] || row.country || "Default Country";
      const stateValue = row[fieldMappings.state] || row.state || "Default State";
      const cityValue = row[fieldMappings.city] || row.city || "Default City";
      const nameValue = row[fieldMappings.name] || row.name || "Unknown Name";
      const addressValue = row[fieldMappings.address] || row.address || "Unknown Address";
      const phoneValue = row[fieldMappings.phone] || row.phone || "0000000000";
      const emailValue = row[fieldMappings.email] || row.email || "unknown@example.com";
      const rowPriceValue = row[fieldMappings.price] || row.price || price || 0;

      // const categoryValue = category || row[fieldMappings.category] || row.category;
      // const countryValue = row[fieldMappings.country] || row.country;
      // const stateValue = row[fieldMappings.state] || row.state;
      // const cityValue = row[fieldMappings.city] || row.city;
      // const nameValue = row[fieldMappings.name] || row.name;
      // const addressValue = row[fieldMappings.address] || row.address;
      // const phoneValue = row[fieldMappings.phone] || row.phone;
      // const emailValue = row[fieldMappings.email] || row.email;
      // const rowPriceValue = row[fieldMappings.price] || row.price || price || null;

      // --- Insert/find category
      const categoryResult = await client.query(
        `INSERT INTO category (category_name) VALUES ($1)
     ON CONFLICT (category_name) DO UPDATE SET category_name=EXCLUDED.category_name
     RETURNING category_id`,
        [categoryValue]
      );
      const categoryId = categoryResult.rows[0].category_id;

      // --- Insert/find country
      const countryResult = await client.query(
        `INSERT INTO country (country_name) VALUES ($1)
     ON CONFLICT (country_name) DO UPDATE SET country_name=EXCLUDED.country_name
     RETURNING country_id`,
        [countryValue]
      );
      const countryId = countryResult.rows[0].country_id;

      // --- Insert/find state
      const stateResult = await client.query(
        `INSERT INTO state (state_name, country_id) VALUES ($1, $2)
     ON CONFLICT (state_name, country_id) DO UPDATE SET state_name=EXCLUDED.state_name
     RETURNING state_id`,
        [stateValue, countryId]
      );
      const stateId = stateResult.rows[0].state_id;

      // --- Insert/find city
      const cityResult = await client.query(
        `INSERT INTO city (city_name, state_id) VALUES ($1, $2)
     ON CONFLICT (city_name, state_id) DO UPDATE SET city_name=EXCLUDED.city_name
     RETURNING city_id`,
        [cityValue, stateId]
      );
      const cityId = cityResult.rows[0].city_id;

      // --- Collect extra fields
      const standardFields = [
        fieldMappings.category,
        fieldMappings.country,
        fieldMappings.state,
        fieldMappings.city,
        fieldMappings.name,
        fieldMappings.address,
        fieldMappings.phone,
        fieldMappings.email,
        fieldMappings.price,
      ].filter(Boolean);

      const customSources = customFieldMappings
        .map((item) => item?.source)
        .filter(Boolean);

      const extraFields = {};

      for (const item of customFieldMappings) {
        const label = item?.label?.trim();
        const source = item?.source;

        if (label && source && row[source] !== undefined && row[source] !== "") {
          extraFields[label] = row[source];
        }
      }

      for (const key in row) {
        if (!standardFields.includes(key) && !customSources.includes(key)) {
          extraFields[key] = row[key];
        }
      }

      // --- Check if dataset exists
      const existing = await client.query(
        "SELECT * FROM dataset WHERE email=$1 AND phone=$2 ",
        [emailValue, phoneValue]
      );

      if (existing.rows.length > 0) {
        const existingRow = existing.rows[0];
        const extraChanged = JSON.stringify(existingRow.extra_fields || {}) !== JSON.stringify(extraFields);

        if (
          existingRow.category_id !== categoryId ||
          existingRow.country_id !== countryId ||
          existingRow.state_id !== stateId ||
          existingRow.city_id !== cityId ||
          existingRow.address !== addressValue ||
          Number(existingRow.price) !== Number(rowPriceValue) ||
          extraChanged
        ) {
          await client.query(
            `UPDATE dataset
         SET category_id=$1, country_id=$2, state_id=$3, city_id=$4,
             address=$5, price=$6, extra_fields=$7
         WHERE dataset_id=$8`,
            [categoryId, countryId, stateId, cityId, addressValue, rowPriceValue, extraFields, existingRow.dataset_id]
          );
          summary.updated += 1;
        } else {
          summary.unchanged += 1;
        }
      } else {
        await client.query(
          `INSERT INTO dataset
       (source_id, category_id, country_id, state_id, city_id, name, address, phone, email, price, extra_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [sourceId, categoryId, countryId, stateId, cityId, nameValue, addressValue, phoneValue, emailValue, rowPriceValue, extraFields]
        );
        summary.added += 1;
      }
    }

    await client.query("COMMIT");
    clearDatasetsCache();

    res.status(200).json({
      success: true,
      message: "Excel/CSV import completed",
      source_id: sourceId,
      summary
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Import Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  } finally {
    client.release();
  }
};




export const getDatasets = async (req, res) => {
  try {
    const { category, country, state, city, source } = req.query;

    const normalizedCategory = category ? Number(category) : null;
    const normalizedCountry = country ? Number(country) : null;
    const normalizedState = state ? Number(state) : null;
    const normalizedCity = city ? Number(city) : null;
    const normalizedSource = source ? Number(source) : null;

    const values = [];
    let idx = 1;
    const normalizedFilters = {
      category: Number.isFinite(normalizedCategory) ? normalizedCategory : null,
      country: Number.isFinite(normalizedCountry) ? normalizedCountry : null,
      state: Number.isFinite(normalizedState) ? normalizedState : null,
      city: Number.isFinite(normalizedCity) ? normalizedCity : null,
      source: Number.isFinite(normalizedSource) ? normalizedSource : null,
    };

    const cachedPayload = getCachedDatasets(normalizedFilters);
    if (cachedPayload) {
      res.set("x-dataset-cache", "HIT");
      return res.status(200).json(cachedPayload);
    }

    const whereClauses = ["1 = 1"];

    if (Number.isFinite(normalizedCategory)) {
      whereClauses.push(`c.category_id = $${idx}`);
      values.push(normalizedCategory);
      idx += 1;
    }
    if (Number.isFinite(normalizedCountry)) {
      whereClauses.push(`co.country_id = $${idx}`);
      values.push(normalizedCountry);
      idx += 1;
    }
    if (Number.isFinite(normalizedState)) {
      whereClauses.push(`s.state_id = $${idx}`);
      values.push(normalizedState);
      idx += 1;
    }
    if (Number.isFinite(normalizedCity)) {
      whereClauses.push(`ci.city_id = $${idx}`);
      values.push(normalizedCity);
      idx += 1;
    }
    if (Number.isFinite(normalizedSource)) {
      whereClauses.push(`d.source_id = $${idx}`);
      values.push(normalizedSource);
      idx += 1;
    }

    const whereClause = `WHERE ${whereClauses.join(" AND ")}`;
    const baseQuery = `
      FROM dataset d
      JOIN category c ON d.category_id = c.category_id
      JOIN country co ON d.country_id = co.country_id
      LEFT JOIN state s ON d.state_id = s.state_id
      LEFT JOIN city ci ON d.city_id = ci.city_id
      ${whereClause}
    `;

    const summaryResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE d.email IS NOT NULL AND d.email <> '')::int AS email_count,
        COUNT(*) FILTER (WHERE d.phone IS NOT NULL AND d.phone <> '')::int AS phone_count
      ${baseQuery}`,
      values,
    );

    const totalRecords = Number(summaryResult.rows[0]?.total_records || 0);
    const emailCount = Number(summaryResult.rows[0]?.email_count || 0);
    const phoneCount = Number(summaryResult.rows[0]?.phone_count || 0);

    let groupByCols = `c.category_id, c.category_name, co.country_id, co.country_name`;
    if (state || city) groupByCols += `, s.state_id, s.state_name`;
    if (city) groupByCols += `, ci.city_id, ci.city_name`;

    const listQuery = `
      SELECT
        MIN(d.dataset_id) AS primary_dataset_id,
        c.category_id,
        c.category_name AS category,
        co.country_id,
        co.country_name AS country,
        ${state || city ? "s.state_id, s.state_name," : ""}
        ${city ? "ci.city_id, ci.city_name," : ""}
        COUNT(*)::int AS total_records,
        COUNT(d.email) FILTER (WHERE d.email IS NOT NULL AND d.email <> '')::int AS email_count,
        COUNT(d.phone) FILTER (WHERE d.phone IS NOT NULL AND d.phone <> '')::int AS phone_count,
        COALESCE(SUM(d.price), 0)::numeric(20, 4) AS total_price
      FROM dataset d
      JOIN category c ON d.category_id = c.category_id
      JOIN country co ON d.country_id = co.country_id
      LEFT JOIN state s ON d.state_id = s.state_id
      LEFT JOIN city ci ON d.city_id = ci.city_id
      ${whereClause}
      GROUP BY ${groupByCols}
      ORDER BY co.country_name, c.category_name;
    `;

    const listRes = await pool.query(listQuery, values);
    const lists = listRes.rows;

    for (let list of lists) {
      const listDataRes = await pool.query(
        `
        SELECT
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
        WHERE d.category_id = $1
          AND d.country_id = $2
          AND ($3::int IS NULL OR d.state_id = $3)
          AND ($4::int IS NULL OR d.city_id = $4)
        ORDER BY d.dataset_id
        LIMIT 15
        `,
        [
          Number(list.category_id),
          Number(list.country_id),
          list.state_id ? Number(list.state_id) : null,
          list.city_id ? Number(list.city_id) : null,
        ],
      );

      const allRecords = listDataRes.rows;
      list.samples = allRecords.slice(0, 10);
      list.view = allRecords.slice(0, 5);
      list.dataset_ids = allRecords.map((row) => row.dataset_id);

      list.name = `List of ${list.category}${list.city_name ? " in " + list.city_name :
        list.state_name ? " in " + list.state_name :
          list.country ? " in " + list.country : ""
        }`;
    }

    const payload = {
      success: true,
      summary: { totalRecords, emailCount, phoneCount },
      lists,
    };

    setCachedDatasets(normalizedFilters, payload);
    res.set("x-dataset-cache", "MISS");
    res.status(200).json(payload);
  } catch (error) {
    console.error("Get Datasets Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`SELECT category_id, category_name FROM category ORDER BY category_name`);
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};




export const getCountries = async (req, res) => {
  try {
    const result = await pool.query(`SELECT country_id, country_name FROM country ORDER BY country_name`);
    res.json({ success: true, countries: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// Get states by country
export const getStates = async (req, res) => {
  try {
    const { countryId } = req.query;
    if (!countryId) {
      return res.status(400).json({ success: false, message: "countryId is required" });
    }
    const result = await pool.query(
      `SELECT state_id, state_name FROM state WHERE country_id=$1 ORDER BY state_name`,
      [countryId]
    );
    res.json({ success: true, states: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// Get cities by state
export const getCities = async (req, res) => {
  try {
    const { stateId } = req.query;
    const result = await pool.query(
      `SELECT city_id, city_name FROM city WHERE state_id=$1 ORDER BY city_name`,
      [stateId]
    );
    res.json({ success: true, cities: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};



export const createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const result = await pool.query(
      `INSERT INTO category (category_name) VALUES ($1) RETURNING category_id, category_name`,
      [category_name]
    );

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};


export const createCountry = async (req, res) => {
  try {
    const { country_name } = req.body;
    if (!country_name) {
      return res.status(400).json({ success: false, message: "Country name is required" });
    }

    const result = await pool.query(
      `INSERT INTO country (country_name) VALUES ($1) RETURNING country_id, country_name`,
      [country_name]
    );

    res.json({ success: true, country: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

export const createCity = async (req, res) => {
  try {
    const { city_name, state_id } = req.body;
    if (!city_name || !state_id) {
      return res.status(400).json({ success: false, message: "City name and state_id are required" });
    }

    const result = await pool.query(
      `INSERT INTO city (city_name, state_id) VALUES ($1, $2) RETURNING city_id, city_name`,
      [city_name, state_id]
    );

    res.json({ success: true, city: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

export const createState = async (req, res) => {
  try {
    const { state_name, country_id } = req.body;
    if (!state_name || !country_id) {
      return res.status(400).json({ success: false, message: "State name and country_id are required" });
    }

    const result = await pool.query(
      `INSERT INTO state (state_name, country_id) VALUES ($1, $2) RETURNING state_id, state_name`,
      [state_name, country_id]
    );

    res.json({ success: true, state: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};






export const getDatasetRecords = async (req, res) => {
  try {
    const { id } = req.params;

    const records = await pool.query(`
      SELECT name, address, phone, email, country, extra_data
      FROM dataset_records
      WHERE dataset_id=$1
    `, [id]);

    res.json(
      records.rows.map(row => ({
        ...row,
        review_count: row.extra_data?.review_count || null,
        review_score: row.extra_data?.review_score || null,
        url: row.extra_data?.url || null
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch dataset records", error: error.message });
  }
};

// GET /api/datasets
export const getDatasetsWithoutFilter = async (req, res) => {
  try {
    const datasets = await pool.query(`
      SELECT id, category, country, state, city, total_records, total_emails, total_phones, sample_file_path
      FROM datasets
    `);

    res.json(
      datasets.rows.map(row => ({
        ...row,
        name: `List of ${row.category}s` +
          (row.city ? ` in ${row.city}, ${row.state}, ${row.country}` :
            row.state ? ` in ${row.state}, ${row.country}` :
              ` in ${row.country}`)
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch datasets", error: error.message });
  }
};

export const getDatasetSources = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT source_id, source_name, description, created_at 
      FROM dataset_source 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, sources: rows });
  } catch (error) {
    console.error("Error fetching dataset sources:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getDatasetSourcePreview = async (req, res) => {
  try {
    const { id } = req.params;
    const sourceResult = await pool.query(
      `SELECT source_id, source_name, description, proof_attachment, created_at
       FROM dataset_source
       WHERE source_id = $1`,
      [id],
    );

    if (!sourceResult.rows.length) {
      return res.status(404).json({ success: false, message: "Dataset source not found" });
    }

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*) AS total_records,
         COUNT(*) FILTER (WHERE d.email IS NOT NULL AND d.email <> '') AS email_count,
         COUNT(*) FILTER (WHERE d.phone IS NOT NULL AND d.phone <> '') AS phone_count,
         COALESCE(SUM(d.price), 0) AS total_price
       FROM dataset d
       WHERE d.source_id = $1`,
      [id],
    );

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
       WHERE d.source_id = $1
       ORDER BY d.dataset_id
       LIMIT 6`,
      [id],
    );

    return res.json({
      success: true,
      source: sourceResult.rows[0],
      summary: summaryResult.rows[0],
      rows: rowsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching dataset source preview:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dataset preview." });
  }
};


export const deleteDatasetSource = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
   
    await client.query('BEGIN');

    await client.query('DELETE FROM dataset WHERE source_id = $1', [id]);
    
    await client.query('DELETE FROM dataset_source WHERE source_id = $1', [id]);

    await client.query('COMMIT');
    clearDatasetsCache();
    
    res.json({ success: true, message: "Dataset source and all related leads deleted successfully." });
  } catch (error) {
  
    await client.query('ROLLBACK');
    console.error("Error deleting dataset source:", error);
    res.status(500).json({ success: false, message: "Failed to delete dataset source." });
  } finally {
   
    client.release();
  }
};
