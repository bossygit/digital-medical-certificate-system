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
const PORT = process.env.PORT || 3000; // Render fournira le PORT

// --- Middleware de Log Simple (Ajoutez ceci) ---
app.use((req, res, next) => {
    console.log(`>>> Request Received: ${req.method} ${req.originalUrl} from Origin: ${req.headers.origin}`);
    next(); // Passe à la suite (CORS)
});

// --- Configuration CORS ---
// Lire l'URL du frontend depuis les variables d'environnement
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001'; // Fallback pour local
console.log(`Configuring CORS for origin: ${allowedOrigin}`); // Log pour vérifier

const corsOptions = {
    origin: allowedOrigin, // Utiliser la variable d'environnement
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

// Basic route (Optionnel pour API seulement)
app.get('/api', (req, res) => { // Mis sous /api pour éviter conflit avec frontend
    res.json({ message: 'Digital Medical Certificate System API' });
});

// --- Servir le Frontend Statique en Production ---
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '../frontend/build'); // Chemin vers le build frontend
    console.log(`Serving static files from: ${frontendBuildPath}`); // Log pour vérifier

    // Servir les fichiers statiques
    app.use(express.static(frontendBuildPath));

    // Pour toutes les autres requêtes (non-API), renvoyer l'index.html du frontend (Gestion du routing côté client)
    app.get('*', (req, res) => {
        // Vérifier si la requête semble être pour une API pour éviter de renvoyer index.html par erreur
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
        } else {
            // Si c'est une requête API non trouvée, renvoyer 404
            res.status(404).json({ message: 'API endpoint not found' });
        }
    });
}

// Start the server
// Écouter sur 0.0.0.0 pour être accessible depuis l'extérieur du conteneur Render
const HOST = '0.0.0.0';
app.listen(PORT, HOST, async () => {
    console.log(`Server running on http://${HOST}:${PORT}`);

    try {
        await sequelize.authenticate();
        console.log('Database connection established.');
    } catch (error) {
        console.error('DB connection error:', error);
        // Considérez de faire planter le processus si la DB n'est pas accessible au démarrage
        // process.exit(1);
    }
});

module.exports = app;