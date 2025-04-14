# Backend - Système de Gestion des Certificats Médicaux Numériques

Ce dossier contient la partie backend (API) du système de gestion des certificats médicaux numériques.

## Structure du projet

```
backend/
├── config/           # Configuration Sequelize
├── controllers/      # Contrôleurs de l'API
├── middleware/       # Middleware (auth, validation)
├── migrations/       # Migrations Sequelize
├── models/           # Modèles de données
├── routes/           # Routes API
├── seeders/          # Données initiales (seeders)
└── services/         # Services et logique métier
```

## Configuration de la base de données

### Prérequis

- MySQL Server (v5.7+)
- Node.js (v14+)
- npm ou yarn

### Étapes de configuration

1. **Installation des dépendances**

   ```bash
   npm install
   ```

2. **Configuration de la base de données**

   Créez les bases de données MySQL nécessaires :

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

   Pour exécuter ce script SQL, utilisez la commande suivante :

   ```bash
   mysql -u root -p < create_databases.sql
   ```

   Ou connectez-vous directement à MySQL et exécutez les commandes :

   ```bash
   mysql -u root -p
   ```

3. **Configuration du fichier de connexion**

   Copiez le fichier de configuration exemple et modifiez-le selon vos paramètres :

   ```bash
   cp config/config.example.json config/config.json
   ```

   Éditez `config/config.json` :

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
           "logging": false,
           "pool": {
               "max": 5,
               "min": 0,
               "acquire": 30000,
               "idle": 10000
           }
       }
   }
   ```

4. **Variables d'environnement**

   Copiez le fichier `.env.example` et configurez-le :

   ```bash
   cp .env.example .env
   ```

   Modifiez `.env` avec vos paramètres spécifiques.

5. **Migrations et seeders**

   Exécutez les migrations pour créer les tables :

   ```bash
   npx sequelize-cli db:migrate
   ```

   Chargez les données initiales (seeders) :

   ```bash
   npx sequelize-cli db:seed:all
   ```

## Exécution du serveur

Pour démarrer le serveur en mode développement :

```bash
npm run dev
```

Pour démarrer le serveur en mode production :

```bash
npm start
```

## Commandes utiles

- **Créer les bases de données** : `npx sequelize-cli db:create`
- **Exécuter les migrations** : `npx sequelize-cli db:migrate`
- **Annuler la dernière migration** : `npx sequelize-cli db:migrate:undo`
- **Exécuter les seeders** : `npx sequelize-cli db:seed:all`
- **Annuler les seeders** : `npx sequelize-cli db:seed:undo:all`
- **Réinitialiser la base de données** : `npm run db:reset`

## Structure des tables de la base de données

La base de données comprend les tables principales suivantes :

1. **Users** : Utilisateurs du système (personnel DGTT)
2. **Doctors** : Médecins agréés
3. **Certificates** : Certificats médicaux
4. **AuditLogs** : Journal d'audit des actions dans le système

## API Endpoints

L'API REST est disponible à `http://localhost:3000/api` avec les endpoints suivants :

- `/api/auth` - Authentification
- `/api/users` - Gestion des utilisateurs
- `/api/doctors` - Gestion des médecins
- `/api/certificates` - Gestion des certificats
- `/api/audit` - Journal d'audit

Pour plus de détails sur les endpoints spécifiques, consultez la documentation de l'API. 