const LaundryRequest = require('../models/LaundryRequest');
const JobHistory = require('../models/JobHistory');

async function createRequest(req, res, next) {
  try {
    const { service_type, items, instructions, pickup_address, dropoff_address, pickup_date, budget } = req.body;
    const request = await LaundryRequest.create({
      client_id: req.user.id,
      service_type,
      items,
      instructions,
      pickup_address,
      dropoff_address,
      pickup_date,
      budget,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

async function getAvailable(req, res, next) {
  try {
    const requests = await LaundryRequest.findAvailable();
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function getMyRequests(req, res, next) {
  try {
    let requests;
    if (req.user.role === 'client') {
      requests = await LaundryRequest.findByClient(req.user.id);
    } else {
      requests = await LaundryRequest.findByWasher(req.user.id);
    }
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function acceptRequest(req, res, next) {
  try {
    const request = await LaundryRequest.accept(req.params.id, req.user.id);
    if (!request) {
      return res.status(400).json({ error: 'Request not available or already accepted' });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
}

async function completeRequest(req, res, next) {
  try {
    const request = await LaundryRequest.advanceStatus(req.params.id, req.user.id);
    if (!request) {
      return res.status(400).json({ error: 'Request not found or not assigned to you' });
    }
    if (request.status === 'delivered') {
      await JobHistory.create({
        request_id: request.id,
        washer_id: req.user.id,
        amount_paid: request.budget,
      });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
}

async function getRequest(req, res, next) {
  try {
    const request = await LaundryRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    next(err);
  }
}

module.exports = { createRequest, getAvailable, getMyRequests, acceptRequest, completeRequest, getRequest };
