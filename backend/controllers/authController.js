const jwt = require('jsonwebtoken');
const User = require('../models/User');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function register(req, res, next) {
  try {
    const { email, password, name, role } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, password, name, role });
    const token = generateToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ valid: true, user });
  } catch (err) {
    return res.status(401).json({ valid: false, error: 'Invalid token' });
  }
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, verify, getMe };
