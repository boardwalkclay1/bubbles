const pool = require('../config/database');

class Payment {
  static async create({ user_id, amount, payment_method, stripe_session_id }) {
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const result = await pool.query(
      `INSERT INTO payments (user_id, amount, payment_method, stripe_session_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, amount, payment_method, stripe_session_id, expires_at]
    );
    return result.rows[0];
  }

  static async findActiveByUser(user_id) {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE user_id = $1 AND status = 'paid' AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [user_id]
    );
    return result.rows[0] || null;
  }

  static async updateStatus(stripe_session_id, status) {
    const result = await pool.query(
      `UPDATE payments SET status = $2 WHERE stripe_session_id = $1 RETURNING *`,
      [stripe_session_id, status]
    );
    return result.rows[0] || null;
  }
}

module.exports = Payment;
