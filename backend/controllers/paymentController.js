const stripe = require('../config/stripe');
const Payment = require('../models/Payment');

async function createCheckout(req, res, next) {
  try {
    const user = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Laundry Bubbles Access (24 hours)',
            description: 'Full access to Laundry Bubbles platform for 24 hours',
          },
          unit_amount: 150, // $1.50 in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendUrl}/index.html?access=granted&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/index.html?payment=cancelled`,
      metadata: {
        user_id: String(user.id),
      },
    });

    await Payment.create({
      user_id: user.id,
      amount: 1.50,
      payment_method: 'stripe',
      stripe_session_id: session.id,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await Payment.updateStatus(session.id, 'paid');
  }

  res.json({ received: true });
}

async function getStatus(req, res, next) {
  try {
    const payment = await Payment.findActiveByUser(req.user.id);
    res.json({
      active: !!payment,
      expiresAt: payment?.expires_at || null,
      payment: payment || null,
    });
  } catch (err) {
    next(err);
  }
}

async function verifySubscription(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await Payment.updateStatus(sessionId, 'paid');
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { createCheckout, webhook, getStatus, verifySubscription };
