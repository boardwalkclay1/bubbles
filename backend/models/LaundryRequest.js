const pool = require('../config/database');

class LaundryRequest {
  static async create({ client_id, service_type, items, instructions, pickup_address, dropoff_address, pickup_date, budget }) {
    const result = await pool.query(
      `INSERT INTO laundry_requests (client_id, service_type, items, instructions, pickup_address, dropoff_address, pickup_date, budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [client_id, service_type || 'standard', items, instructions, pickup_address, dropoff_address, pickup_date, budget]
    );
    return result.rows[0];
  }

  static async findAvailable() {
    const result = await pool.query(
      `SELECT r.*, u.name as client_name FROM laundry_requests r
       JOIN users u ON u.id = r.client_id
       WHERE r.status = 'requested' AND r.washer_id IS NULL
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  }

  static async findByClient(client_id) {
    const result = await pool.query(
      `SELECT r.*, u.name as washer_name FROM laundry_requests r
       LEFT JOIN users u ON u.id = r.washer_id
       WHERE r.client_id = $1
       ORDER BY r.created_at DESC`,
      [client_id]
    );
    return result.rows;
  }

  static async findByWasher(washer_id) {
    const result = await pool.query(
      `SELECT r.*, u.name as client_name FROM laundry_requests r
       JOIN users u ON u.id = r.client_id
       WHERE r.washer_id = $1 AND r.status != 'delivered'
       ORDER BY r.created_at DESC`,
      [washer_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT r.*, 
        uc.name as client_name, uc.phone as client_phone,
        uw.name as washer_name
       FROM laundry_requests r
       JOIN users uc ON uc.id = r.client_id
       LEFT JOIN users uw ON uw.id = r.washer_id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async accept(id, washer_id) {
    const result = await pool.query(
      `UPDATE laundry_requests SET washer_id = $2, status = 'accepted'
       WHERE id = $1 AND status = 'requested' AND washer_id IS NULL
       RETURNING *`,
      [id, washer_id]
    );
    return result.rows[0] || null;
  }

  static async advanceStatus(id, washer_id) {
    const sequence = ['requested', 'accepted', 'picked_up', 'in_progress', 'completed', 'delivered'];
    const current = await pool.query('SELECT status FROM laundry_requests WHERE id = $1 AND washer_id = $2', [id, washer_id]);
    if (!current.rows[0]) return null;
    const currentStatus = current.rows[0].status;
    const nextIndex = sequence.indexOf(currentStatus) + 1;
    if (nextIndex >= sequence.length) return current.rows[0];
    const nextStatus = sequence[nextIndex];
    const result = await pool.query(
      'UPDATE laundry_requests SET status = $3 WHERE id = $1 AND washer_id = $2 RETURNING *',
      [id, washer_id, nextStatus]
    );
    return result.rows[0] || null;
  }
}

module.exports = LaundryRequest;
