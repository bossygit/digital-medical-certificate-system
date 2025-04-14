-- Script de création des bases de données pour le Système de Gestion des Certificats Médicaux Numériques

-- Suppression des bases de données si elles existent déjà (attention en production !)
DROP DATABASE IF EXISTS medical_certificate_system_dev;
DROP DATABASE IF EXISTS medical_certificate_system_test;
DROP DATABASE IF EXISTS medical_certificate_system_prod;

-- Création des bases de données avec le support Unicode (utf8mb4)
CREATE DATABASE medical_certificate_system_dev
CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;
CREATE DATABASE medical_certificate_system_test
CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;
CREATE DATABASE medical_certificate_system_prod
CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Attribution des privilèges (modifiez l'utilisateur selon votre configuration)
-- Par défaut, nous utilisons 'root' mais vous devriez idéalement utiliser un utilisateur dédié
GRANT ALL PRIVILEGES ON medical_certificate_system_dev.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON medical_certificate_system_test.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON medical_certificate_system_prod.* TO 'root'@'localhost';

-- Si vous utilisez un utilisateur personnalisé, décommentez et modifiez les lignes suivantes:
-- CREATE USER 'medical_admin'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON medical_certificate_system_dev.* TO 'medical_admin'@'localhost';
-- GRANT ALL PRIVILEGES ON medical_certificate_system_test.* TO 'medical_admin'@'localhost';
-- GRANT ALL PRIVILEGES ON medical_certificate_system_prod.* TO 'medical_admin'@'localhost';

-- Appliquer les privilèges
FLUSH PRIVILEGES; 