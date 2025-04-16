require('dotenv').config();

module.exports = {
    "development": {
        "username": process.env.DB_USER || "root",
        "password": process.env.DB_PASSWORD || "",
        "database": process.env.DB_NAME || "medical_certificate_system_dev",
        "host": process.env.DB_HOST || "127.0.0.1",
        "dialect": "mysql" // MySQL pour le développement local
    },
    "test": {
        "username": process.env.DB_USER || "root",
        "password": process.env.DB_PASSWORD || "",
        "database": process.env.DB_NAME || "medical_certificate_system_test",
        "host": process.env.DB_HOST || "127.0.0.1",
        "dialect": "mysql"
    },
    "production": {
        "use_env_variable": "DATABASE_URL", // Pour Render
        "dialect": "postgres", // PostgreSQL pour la production
        "dialectOptions": {
            "ssl": {
                "require": true,
                "rejectUnauthorized": false // Nécessaire pour Render
            }
        }
    }
};
