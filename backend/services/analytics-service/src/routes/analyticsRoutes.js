const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  adminSummary, adminBookingsSeries,
  coiffeurSummary, coiffeurSeries, coiffeurTopServices
} = require('../controllers/analyticsController');

const router = express.Router();

// Toutes les routes protégées
router.use(protect);

// Admin
router.get('/summary', authorize('admin'), adminSummary);
router.get('/bookings/series', authorize('admin'), adminBookingsSeries);

// Coiffeur
router.get('/coiffeur/summary', authorize('coiffeur'), coiffeurSummary);
router.get('/coiffeur/series', authorize('coiffeur'), coiffeurSeries);
router.get('/coiffeur/services/top', authorize('coiffeur'), coiffeurTopServices);

module.exports = router;