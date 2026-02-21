-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'washer')),
  phone VARCHAR(50),
  apple_pay_handle VARCHAR(255),
  cash_app_handle VARCHAR(255),
  paypal_email VARCHAR(255),
  card_note VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Laundry Requests table
CREATE TABLE IF NOT EXISTS laundry_requests (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_type VARCHAR(100) DEFAULT 'standard',
  items TEXT,
  instructions TEXT,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT,
  pickup_date TIMESTAMP,
  budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested','accepted','picked_up','in_progress','completed','delivered')),
  washer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Washer Profiles table
CREATE TABLE IF NOT EXISTS washer_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  service_area TEXT,
  skills TEXT,
  payment_methods TEXT,
  payment_handle VARCHAR(255),
  availability TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  payment_method VARCHAR(100),
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Job History table
CREATE TABLE IF NOT EXISTS job_history (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES laundry_requests(id) ON DELETE CASCADE,
  washer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP,
  amount_paid DECIMAL(10,2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT
);

-- Location signals table
CREATE TABLE IF NOT EXISTS location_signals (
  id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_washer_profiles_updated_at BEFORE UPDATE ON washer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
