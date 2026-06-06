
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    user: process.env.PGUSER,
    host: "127.0.0.1",
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT || 5432),
});

async function cleanup() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        console.log("Cleanup started with collision-aware hierarchical merge...");

        // 1. Merge Countries (and their children)
        const countriesRes = await client.query("SELECT country_id, country_name FROM country");
        const countryGroups = {};
        countriesRes.rows.forEach(r => {
            let key = r.country_name.trim().toUpperCase();
            if (key === 'UAE') key = 'UNITED ARAB EMIRATES';
            if (key === 'USA' || key === 'U.S.A.' || key === 'US') key = 'UNITED STATES';
            if (key === 'UK' || key === 'U.K.' || key === 'GB') key = 'UNITED KINGDOM';

            if (!countryGroups[key]) countryGroups[key] = [];
            countryGroups[key].push(r);
        });

        for (const group of Object.values(countryGroups)) {
            if (group.length > 1) {
                const primary = group.find(g => g.country_name.length > 5) || group[0];
                const others = group.filter(g => g.country_id !== primary.country_id);
                for (const other of others) {
                    console.log(`Merging country ${other.country_name} -> ${primary.country_name}`);

                    // Move states
                    const statesRes = await client.query("SELECT state_id, state_name FROM state WHERE country_id = $1", [other.country_id]);
                    for (const s of statesRes.rows) {
                        // Check if this state exists in primary country
                        const exists = await client.query("SELECT state_id FROM state WHERE UPPER(state_name) = UPPER($1) AND country_id = $2", [s.state_name, primary.country_id]);
                        if (exists.rows.length) {
                            const targetStateId = exists.rows[0].state_id;
                            // Move datasets from old state to target state
                            await client.query("UPDATE dataset SET state_id = $1, country_id = $2 WHERE state_id = $3", [targetStateId, primary.country_id, s.state_id]);
                            // Delete old state after moving its children (cities)
                            const citiesRes = await client.query("SELECT city_id, city_name FROM city WHERE state_id = $1", [s.state_id]);
                            for (const c of citiesRes.rows) {
                                const cExists = await client.query("SELECT city_id FROM city WHERE UPPER(city_name) = UPPER($1) AND state_id = $2", [c.city_name, targetStateId]);
                                if (cExists.rows.length) {
                                    const targetCityId = cExists.rows[0].city_id;
                                    await client.query("UPDATE dataset SET city_id = $1 WHERE city_id = $2", [targetCityId, c.city_id]);
                                    await client.query("DELETE FROM city WHERE city_id = $1", [c.city_id]);
                                } else {
                                    await client.query("UPDATE city SET state_id = $1 WHERE city_id = $2", [targetStateId, c.city_id]);
                                }
                            }
                            await client.query("DELETE FROM state WHERE state_id = $1", [s.state_id]);
                        } else {
                            await client.query("UPDATE state SET country_id = $1 WHERE state_id = $2", [primary.country_id, s.state_id]);
                            await client.query("UPDATE dataset SET country_id = $1 WHERE state_id = $2", [primary.country_id, s.state_id]);
                        }
                    }
                    // Move datasets that only had country_id (no state)
                    await client.query("UPDATE dataset SET country_id = $1 WHERE country_id = $2", [primary.country_id, other.country_id]);
                    await client.query("DELETE FROM country WHERE country_id = $1", [other.country_id]);
                }
            }
        }

        // 2. Generic Case-Insensitive cleanup for Category
        console.log("Cleanup Categories...");
        const catRes = await client.query("SELECT category_id, category_name FROM category");
        const catGroups = {};
        catRes.rows.forEach(r => {
            const key = r.category_name.trim().toUpperCase();
            if (!catGroups[key]) catGroups[key] = [];
            catGroups[key].push(r);
        });
        for (const group of Object.values(catGroups)) {
            if (group.length > 1) {
                const primary = group[0];
                const others = group.slice(1);
                for (const other of others) {
                    await client.query("UPDATE dataset SET category_id = $1 WHERE category_id = $2", [primary.category_id, other.category_id]);
                    await client.query("DELETE FROM category WHERE category_id = $1", [other.category_id]);
                }
            }
        }

        await client.query("COMMIT");
        console.log("Collision-aware cleanup completed successfully.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Cleanup failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

cleanup();
