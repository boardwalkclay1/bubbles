const pool = require('../config/database');

class WasherProfile {
  static async upsert(user_id, fields) {
    const { service_area, skills, payment_methods, payment_handle, availability, is_available } = fields;
    const result = await pool.query(
      `INSERT INTO washer_profiles (user_id, service_area, skills, payment_methods, payment_handle, availability, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         service_area = EXCLUDED.service_area,
         skills = EXCLUDED.skills,
         payment_methods = EXCLUDED.payment_methods,
         payment_handle = EXCLUDED.payment_handle,
         availability = EXCLUDED.availability,
         is_available = EXCLUDED.is_available,
         updated_at = NOW()
       RETURNING *`,
      [user_id, service_area, skills, payment_methods, payment_handle, availability, is_available]
    );
    return result.rows[0];
  }

  static async findByUserId(user_id) {
    const result = await pool.query('SELECT * FROM washer_profiles WHERE user_id = $1', [user_id]);
    return result.rows[0] || null;
  }

  static async updateLocation(user_id, lat, lng) {
    await pool.query(
      'UPDATE washer_profiles SET lat = $2, lng = $3, updated_at = NOW() WHERE user_id = $1',
      [user_id, lat, lng]
    );
  }

  static async findNearby(lat, lng, radiusKm = 50) {
    const result = await pool.query(
      `SELECT wp.*, u.name, u.email
       FROM washer_profiles wp
       JOIN users u ON u.id = wp.user_id
       WHERE wp.is_available = true
         AND wp.lat IS NOT NULL AND wp.lng IS NOT NULL
         AND (
           6371 * acos(
             cos(radians($1)) * cos(radians(wp.lat)) *
             cos(radians(wp.lng) - radians($2)) +
             sin(radians($1)) * sin(radians(wp.lat))
           )
         ) < $3
       ORDER BY (
         6371 * acos(
           cos(radians($1)) * cos(radians(wp.lat)) *
           cos(radians(wp.lng) - radians($2)) +
           sin(radians($1)) * sin(radians(wp.lat))
         )
       ) ASC`,
      [lat, lng, radiusKm]
    );
    return result.rows;
  }
}

module.exports = WasherProfile;
