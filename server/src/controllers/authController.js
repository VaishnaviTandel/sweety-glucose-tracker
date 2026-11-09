const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function badRequest(res, field, message) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', field, message } });
}

exports.register = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name) return badRequest(res, 'name', 'Please enter your name.');
    if (!EMAIL_REGEX.test(email)) return badRequest(res, 'email', 'Please enter a valid email.');
    if (password.length < 8) {
      return badRequest(res, 'password', 'Password must be at least 8 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    return res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    if (err.code === '23505') {
      return badRequest(res, 'email', 'An account with this email already exists.');
    }
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};

exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    const row = result.rows[0];

    // Same message for "no such user" and "wrong password" so we don't leak which emails exist
    const ok = row && (await bcrypt.compare(password, row.password_hash));
    if (!ok) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const user = { id: row.id, name: row.name, email: row.email };
    return res.json({ token: signToken(user.id), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please log in again.' } });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
};