const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Vérifier que JWT_SECRET est défini
if (!process.env.JWT_SECRET) {
  console.error('ERREUR FATALE: JWT_SECRET non défini dans les variables d\'environnement');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analytics', require('./routes/analyticsRoutes'));

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Analytics-service démarré sur le port ${PORT}`);
});