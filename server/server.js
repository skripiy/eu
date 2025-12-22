const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Налаштування підключення до БД (змінні з docker-compose)
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'student',
  host: process.env.DB_HOST || 'db',
  database: process.env.POSTGRES_DB || 'web_lab',
  password: process.env.POSTGRES_PASSWORD || 'securepass',
  port: 5432,
});

// 1. Оновлена ініціалізація БД
const initDB = async () => {
  try {
    // Таблиця повідомлень (стара)
    await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    // Таблиця візитів (НОВА)
    await pool.query(`
            CREATE TABLE IF NOT EXISTS visits (
                id SERIAL PRIMARY KEY,
                page VARCHAR(100),
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log('Database tables are ready.');
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
};
initDB();

// --- ROUTES ---

// GET / - Перевірка здоров'я
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', db: 'PostgreSQL' });
});

// --- НОВІ МАРШРУТИ АНАЛІТИКИ ---
// POST /visit (Frontend calls /api/visit -> Nginx strips /api -> Backend receives /visit)
app.post('/visit', async (req, res) => {
  const { page, userAgent } = req.body;
  try {
    await pool.query(
      'INSERT INTO visits (page, user_agent) VALUES ($1, $2)',
      [page, userAgent]
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
    const totalResult = await pool.query('SELECT COUNT(*) FROM visits');
    const pagesResult = await pool.query('SELECT page, COUNT(*) as count FROM visits GROUP BY page ORDER BY count DESC LIMIT 5');

    res.json({
      total: totalResult.rows[0].count,
      topPages: pagesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stats error' });
  }
});

// POST /messages - Зберегти повідомлення з форми
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

// GET /messages - Отримати всі повідомлення (для тесту)
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
