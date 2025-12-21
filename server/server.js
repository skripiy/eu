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

// Ініціалізація таблиці при старті
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
    console.log('Database table "messages" is ready.');
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
