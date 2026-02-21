const pool = require('../config/database');

class JobHistory {
  static async create({ request_id, washer_id, amount_paid }) {
    const result = await pool.query(
      `INSERT INTO job_history (request_id, washer_id, completed_at, amount_paid)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [request_id, washer_id, amount_paid]
    );
    return result.rows[0];
  }

  static async findByWasher(washer_id) {
    const result = await pool.query(
      `SELECT jh.*, r.pickup_address, r.dropoff_address, u.name as client_name
       FROM job_history jh
       JOIN laundry_requests r ON r.id = jh.request_id
       JOIN users u ON u.id = r.client_id
       WHERE jh.washer_id = $1
       ORDER BY jh.completed_at DESC`,
      [washer_id]
    );
    return result.rows;
  }
}

module.exports = JobHistory;
