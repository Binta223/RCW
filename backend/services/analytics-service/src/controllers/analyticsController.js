const axios = require('axios');

const BOOKING_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:5001';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';

// Utils
const toDayStart = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const inRange = (date, from, to) => {
  if (!from && !to) return true;
  const d = toDayStart(date);
  if (from && d < toDayStart(from)) return false;
  if (to && d > toDayStart(to)) return false;
  return true;
};
const sum = (arr) => arr.reduce((a,b) => a + b, 0);

// Admin: Summary
exports.adminSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Récupérer utilisateurs
    const usersResp = await axios.get(`${AUTH_URL}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const users = usersResp.data?.data || [];

    // Récupérer réservations
    const bookingsResp = await axios.get(`${BOOKING_URL}/api/bookings/admin/bookings`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const bookings = (bookingsResp.data?.data || []).filter(b => inRange(b.date, from, to));

    const totalUsers = users.length;
    const totalCoiffeurs = users.filter(u => u.role === 'coiffeur').length;
    const totalBookings = bookings.length;
    const byStatus = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    const revenue = sum(bookings.filter(b => b.status === 'completed').map(b => Number(b.price || 0)));

    res.json({
      success: true,
      data: { totalUsers, totalCoiffeurs, totalBookings, byStatus, revenue }
    });
  } catch (err) {
    console.error('adminSummary error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur analytics admin' });
  }
};

// Admin: bookings series
exports.adminBookingsSeries = async (req, res) => {
  try {
    const { from, to, granularity = 'day' } = req.query;
    const bookingsResp = await axios.get(`${BOOKING_URL}/api/bookings/admin/bookings`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const bookings = (bookingsResp.data?.data || []).filter(b => inRange(b.date, from, to));

    const bucketKey = (dateStr) => {
      const d = new Date(dateStr);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth()+1).padStart(2,'0');
      const day = String(d.getUTCDate()).padStart(2,'0');
      if (granularity === 'month') return `${y}-${m}`;
      if (granularity === 'week') {
        const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + (1 - dayNum));
        const wy = tmp.getUTCFullYear();
        const wm = String(tmp.getUTCMonth()+1).padStart(2,'0');
        const wd = String(tmp.getUTCDate()).padStart(2,'0');
        return `${wy}-${wm}-${wd}`;
      }
      return `${y}-${m}-${day}`;
    };

    const agg = {};
    for (const b of bookings) {
      const k = bucketKey(b.date);
      agg[k] = agg[k] || { bookings: 0, completed: 0, cancelled: 0, revenue: 0 };
      agg[k].bookings += 1;
      if (b.status === 'completed') {
        agg[k].completed += 1;
        agg[k].revenue += Number(b.price || 0);
      }
      if (b.status === 'cancelled') {
        agg[k].cancelled += 1;
      }
    }

    const data = Object.keys(agg).sort().map(k => ({ bucket: k, ...agg[k] }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('adminBookingsSeries error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur analytics admin series' });
  }
};

// Coiffeur: Summary
exports.coiffeurSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    // appelle la route coiffeur du booking-service en utilisant le token du coiffeur
    const bookingsResp = await axios.get(`${BOOKING_URL}/api/bookings/coiffeur/bookings`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const bookings = (bookingsResp.data?.data || []).filter(b => inRange(b.date, from, to));

    const totalBookings = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const upcoming = bookings.filter(b => 
      (['pending','confirmed'].includes(b.status)) && new Date(b.date) >= toDayStart(new Date())
    ).length;
    const revenue = sum(bookings.filter(b => b.status === 'completed').map(b => Number(b.price || 0)));
    const cancellationRate = totalBookings ? cancelled / totalBookings : 0;

    res.json({
      success: true,
      data: { totalBookings, completed, cancelled, upcoming, revenue, cancellationRate }
    });
  } catch (err) {
    console.error('coiffeurSummary error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur analytics coiffeur' });
  }
};

// Coiffeur: series
exports.coiffeurSeries = async (req, res) => {
  try {
    const { from, to, granularity = 'day' } = req.query;
    const bookingsResp = await axios.get(`${BOOKING_URL}/api/bookings/coiffeur/bookings`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const bookings = (bookingsResp.data?.data || []).filter(b => inRange(b.date, from, to));

    const bucketKey = (dateStr) => {
      const d = new Date(dateStr);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth()+1).padStart(2,'0');
      const day = String(d.getUTCDate()).padStart(2,'0');
      if (granularity === 'month') return `${y}-${m}`;
      if (granularity === 'week') {
        const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + (1 - dayNum));
        const wy = tmp.getUTCFullYear();
        const wm = String(tmp.getUTCMonth()+1).padStart(2,'0');
        const wd = String(tmp.getUTCDate()).padStart(2,'0');
        return `${wy}-${wm}-${wd}`;
      }
      return `${y}-${m}-${day}`;
    };

    const agg = {};
    for (const b of bookings) {
      const k = bucketKey(b.date);
      agg[k] = agg[k] || { bookings: 0, completed: 0, cancelled: 0, revenue: 0 };
      agg[k].bookings += 1;
      if (b.status === 'completed') {
        agg[k].completed += 1;
        agg[k].revenue += Number(b.price || 0);
      }
      if (b.status === 'cancelled') {
        agg[k].cancelled += 1;
      }
    }

    const data = Object.keys(agg).sort().map(k => ({ bucket: k, ...agg[k] }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('coiffeurSeries error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur analytics coiffeur series' });
  }
};

// Coiffeur: top services
exports.coiffeurTopServices = async (req, res) => {
  try {
    const { from, to, limit = 5 } = req.query;
    const bookingsResp = await axios.get(`${BOOKING_URL}/api/bookings/coiffeur/bookings`, {
      headers: { Authorization: `Bearer ${req.token}` }
    });
    const bookings = (bookingsResp.data?.data || []).filter(b => inRange(b.date, from, to));

    // accumulate by service id + name (service peut être populé ou id)
    const byService = {};
    for (const b of bookings) {
      const id = typeof b.service === 'object' ? (b.service._id || b.service.id) : b.service;
      const name = typeof b.service === 'object' ? (b.service.name || 'Service') : 'Service';
      if (!id) continue;
      if (!byService[id]) byService[id] = { serviceId: id, name, count: 0, revenue: 0 };
      byService[id].count += 1;
      if (b.status === 'completed') byService[id].revenue += Number(b.price || 0);
    }
    const arr = Object.values(byService).sort((a,b) => b.count - a.count).slice(0, Number(limit));
    res.json({ success: true, data: arr });
  } catch (err) {
    console.error('coiffeurTopServices error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur analytics coiffeur top services' });
  }
};