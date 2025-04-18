const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes'); // Importez les routes admin
const certificateRoutes = require('./routes/certificate.routes'); // <<< Importez

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
// --- Vérifiez ce port ---
// L'erreur indique que le frontend appelle localhost:5000
// Assurez-vous que le backend écoute sur le même port
const PORT = process.env.PORT || 3000; // Mettez 5000 ici
// --- Middleware de Log Simple (Ajoutez ceci) ---
app.use((req, res, next) => {
    console.log(`>>> Request Received: ${req.method} ${req.originalUrl} from Origin: ${req.headers.origin}`);
    next(); // Passe à la suite (CORS)
});
// --- Configuration CORS détaillée ---
const corsOptions = {
    origin: 'http://localhost:3001', // Autorise spécifiquement votre frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // Certains navigateurs (anciens) peuvent avoir besoin de 200 au lieu de 204
};

// Middleware
app.use(cors(corsOptions)); // Utilisez la configuration détaillée
// La ligne app.options('*', ...) reste commentée/supprimée
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Enregistrez les routes admin sous /api/admin
app.use('/api/certificates', certificateRoutes); // <<< Enregistrez

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Digital Medical Certificate System API' });
});

// Si en production, servir les fichiers statiques du build React
if (process.env.NODE_ENV === 'production') {
    // Pour servir les fichiers statiques du dossier frontend/build
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Pour toutes les routes non-API, renvoyer l'index.html de React
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });
}

// Start the server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`); // Le port doit être 5000

    try {
        await sequelize.authenticate();
        console.log('Database connection established.');
    } catch (error) {
        console.error('DB connection error:', error);
    }
});

module.exports = app;