const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust proxy pour le rate limiter
app.set('trust proxy', 1);

// Rate limiting global - désactivé en développement
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requêtes par minute en dev
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

// Rate limiting pour l'authentification - augmenté pour dev
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 tentatives par minute en dev
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(limiter);

// Rate limiting spécifique pour les routes d'auth
app.use('/auth/api/auth/login', authLimiter);
app.use('/auth/api/auth/register', authLimiter);

// Configuration des services
const services = {
  '/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
  '/bookings': process.env.BOOKING_SERVICE_URL || 'http://localhost:4002'
};

// Configuration du proxy pour chaque service
Object.entries(services).forEach(([route, target]) => {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
  }));
});

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({
    message: "Bienvenue sur l'API Gateway",
    services: Object.keys(services)
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway démarré sur le port ${PORT}`);
});
