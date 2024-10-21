import Fastify from "fastify";
import sqlite3 from "sqlite3";
import cors from '@fastify/cors'

import { ORDER_FILTERS } from '../../utils';

(async () => {
  const fastify = Fastify({});
  await fastify.register(cors, { origin: '*' });
  
  const db = new sqlite3.Database("./db/winedrops.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message, err);
    } else {
      console.info("Connected to the winedrops database.");
    }
  });

  fastify.get("/", () => {
    return { hello: "world" };
  });

  fastify.get("/best_selling_wines", (req) => {
    const { query: { orderBy, search } } = req as any;
    const selectedFilter = ORDER_FILTERS[orderBy] || ORDER_FILTERS.REVENUE;
    const query = `
      SELECT
        mw.id AS id,
        mw.name || ' ' || mw.vintage AS full_name,
        SUM(co.total_amount) AS revenue,
        SUM(co.quantity) AS sold_bottles,
        COUNT(co.id) AS order_count
      FROM
        master_wine AS mw
      INNER JOIN
        wine_product wp ON mw.id = wp.master_wine_id
      LEFT JOIN
        customer_order co ON wp.id = co.wine_product_id
      WHERE
        co.status IN ('paid', 'dispatched')
        ${search ? `AND mw.name || ' '|| mw.vintage LIKE '%${search || ''}%'` : ''}
      GROUP BY 
        mw.id
      ORDER BY
        ${selectedFilter} DESC
    `;

    return new Promise((resolve) => {
      db.all(query, (err, rows) => {
        if (err) {
          console.error(err.message);
        }
        resolve({ items: rows || [], total: rows.length, err });
      });
    });
  });

  fastify.get("/wines", () => {
    return new Promise((resolve) => {
      db.all("SELECT * FROM master_wine", (err, rows) => {
        if (err) {
          console.error(err.message);
        }
        resolve({ items: rows || [], total: rows.length, err });
      });
    });
  });

  fastify.get("/products", () => {
    return new Promise((resolve) => {
      db.all("SELECT * FROM wine_product", (err, rows) => {
        if (err) {
          console.error(err.message);
        }
        resolve({ items: rows || [], total: rows.length, err });
      });
    });
  });

  fastify.get("/valid_orders", () => {
    return new Promise((resolve) => {
      db.all("SELECT * FROM customer_order AS t1 WHERE t1.status IN ('paid', 'dispatched')", (err, rows) => {
        if (err) {
          console.error(err.message);
        }
        resolve({ items: rows || [], total: rows.length, err });
      });
    });
  });

  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
