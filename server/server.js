const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'student',
  host: process.env.DB_HOST || 'db',
  database: process.env.POSTGRES_DB || 'web_lab',
  password: process.env.POSTGRES_PASSWORD || 'securepass',
  port: 5432,
});

const initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    // ОНОВЛЕНА ТАБЛИЦЯ (з session_id)
    // Примітка: якщо таблиця вже є, стара колонка не додасться автоматично,
    // тому краще дропнути таблицю вручну або додати колонку.
    // Для лабораторної ми створимо нову таблицю 'advanced_visits' щоб уникнути конфліктів.
    await pool.query(`
            CREATE TABLE IF NOT EXISTS advanced_visits (
                id SERIAL PRIMARY KEY,
                page VARCHAR(100),
                session_id VARCHAR(100),
                browser VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log('Database tables are ready.');
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
};
initDB();

// Допоміжна функція для визначення браузера
function detectBrowser(userAgent) {
  if (/chrome|chromium|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/edg/i.test(userAgent)) return "Edge";
  return "Other";
}

app.get('/', (req, res) => res.json({ status: 'Server is running' }));

// POST /visit
app.post('/visit', async (req, res) => {
  const { page, userAgent, sessionId } = req.body;
  const browser = detectBrowser(userAgent || '');
  try {
    await pool.query(
      'INSERT INTO advanced_visits (page, session_id, browser) VALUES ($1, $2, $3)',
      [page, sessionId, browser]
    );
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tracking error' });
  }
});

// GET /stats
app.get('/stats', async (req, res) => {
  try {
    // 1. Загальна кількість переглядів
    const total = await pool.query('SELECT COUNT(*) FROM advanced_visits');

    // 2. Унікальні відвідувачі
    const unique = await pool.query('SELECT COUNT(DISTINCT session_id) FROM advanced_visits');

    // 3. Топ сторінок
    const pages = await pool.query('SELECT page, COUNT(*) as count FROM advanced_visits GROUP BY page ORDER BY count DESC LIMIT 5');

    // 4. Браузери (для діаграми)
    const browsers = await pool.query('SELECT browser, COUNT(*) as count FROM advanced_visits GROUP BY browser');

    res.json({
      total: total.rows[0].count,
      unique: unique.rows[0].count,
      topPages: pages.rows,
      browsers: browsers.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stats error' });
  }
});

// Маршрути для повідомлень
app.post('/messages', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
