# Système de Gestion des Certificats Médicaux Numériques

Application web permettant aux médecins agréés de créer des certificats médicaux numériques, et à l'administration DGTT de les vérifier.

## Architecture

- **Frontend** : React avec React Bootstrap
- **Backend** : Node.js avec Express.js
- **Base de données** : MySQL avec Sequelize ORM

## Installation

### Prérequis

- Node.js (v14+)
- MySQL (v5.7+)
- npm ou yarn

### Configuration

1. Clonez le dépôt :
   ```
   git clone https://github.com/votre-nom/digital-medical-certificate-system.git
   cd digital-medical-certificate-system
   ```

2. Installez les dépendances :
   ```
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. Configuration de la base de données :
   - Créez les bases de données MySQL avec le script suivant :
     ```sql
     -- Création des bases de données
     CREATE DATABASE medical_certificate_system_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     CREATE DATABASE medical_certificate_system_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     CREATE DATABASE medical_certificate_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

     -- Attribution des privilèges (ajustez selon votre configuration)
     GRANT ALL PRIVILEGES ON medical_certificate_system_dev.* TO 'votre_utilisateur'@'localhost';
     GRANT ALL PRIVILEGES ON medical_certificate_system_test.* TO 'votre_utilisateur'@'localhost';
     GRANT ALL PRIVILEGES ON medical_certificate_system_prod.* TO 'votre_utilisateur'@'localhost';

     FLUSH PRIVILEGES;
     ```
   - Copiez `backend/config/config.example.json` vers `backend/config/config.json`
   - Modifiez les paramètres dans `config.json` selon votre configuration :
     ```json
     {
         "development": {
             "username": "votre_utilisateur",
             "password": "votre_mot_de_passe",
             "database": "medical_certificate_system_dev",
             "host": "127.0.0.1",
             "dialect": "mysql"
         },
         "test": {
             "username": "votre_utilisateur",
             "password": "votre_mot_de_passe",
             "database": "medical_certificate_system_test",
             "host": "127.0.0.1",
             "dialect": "mysql"
         },
         "production": {
             "username": "votre_utilisateur",
             "password": "votre_mot_de_passe",
             "database": "medical_certificate_system_prod",
             "host": "127.0.0.1",
             "dialect": "mysql",
             "logging": false
         }
     }
     ```

4. Variables d'environnement :
   - Copiez `backend/.env.example` vers `backend/.env`
   - Modifiez les valeurs dans `.env` selon votre environnement

5. Exécutez les migrations et seeders :
   ```
   cd backend
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

### Démarrage

1. Lancez le backend :
   ```
   cd backend
   npm start
   ```

2. Lancez le frontend :
   ```
   cd frontend
   npm start
   ```

3. Accédez à l'application dans votre navigateur : `http://localhost:3000`

## Compte administrateur par défaut

- Email : admin@dgtt.ma
- Mot de passe : admin123 (à changer immédiatement après la première connexion)

## Fonctionnalités

- Authentification des utilisateurs (médecins, personnel DGTT)
- Création et gestion des certificats médicaux
- Validation des certificats
- Historique des certificats
- Gestion des utilisateurs

## Structure du projet

```
digital-medical-certificate-system/
├── backend/              # API Node.js/Express
│   ├── config/           # Configuration Sequelize
│   ├── controllers/      # Contrôleurs
│   ├── migrations/       # Migrations Sequelize
│   ├── models/           # Modèles de données
│   ├── routes/           # Routes API
│   ├── seeders/          # Données initiales
│   └── services/         # Services et logique métier
└── frontend/             # Application React
    ├── public/           # Fichiers statiques
    └── src/              # Code source React
        ├── components/   # Composants React
        ├── contexts/     # Contextes React (auth, etc.)
        ├── pages/        # Pages de l'application
        ├── routes/       # Configuration des routes
        └── services/     # Services API
```

## Documentation API

L'API REST est disponible à `http://localhost:3000/api`

## Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Protection contre les injections SQL via Sequelize
- Validation des entrées utilisateur

## Licence

[MIT](LICENSE)
