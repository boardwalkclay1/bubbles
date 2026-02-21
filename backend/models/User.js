const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, name, role }) {
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, password_hash, name, role]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, apple_pay_handle, cash_app_handle, paypal_email, card_note, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, name, role, phone, apple_pay_handle, cash_app_handle, paypal_email, card_note`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  }
}

module.exports = User;
