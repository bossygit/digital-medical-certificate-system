'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dgtt.ma';

    // ---> Vérifier si l'utilisateur existe déjà <---
    const users = await queryInterface.sequelize.query(
      `SELECT user_id FROM "Users" WHERE email = :email LIMIT 1;`, // Utilisez des guillemets doubles pour PostgreSQL
      {
        replacements: { email: adminEmail },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // ---> Insérer seulement si l'utilisateur n'existe pas <---
    if (users.length === 0) {
      console.log(`Admin user ${adminEmail} not found, creating...`); // Log utile
      const saltRounds = 10;
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      await queryInterface.bulkInsert('Users', [{
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'dgtt_admin',
        first_name: 'Admin',
        last_name: 'DGTT',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
      console.log(`Admin user ${adminEmail} created.`); // Log utile
    } else {
      console.log(`Admin user ${adminEmail} already exists, skipping seed.`); // Log utile
    }
  },

  async down(queryInterface, Sequelize) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dgtt.ma';
    // La fonction down peut rester telle quelle, elle essaiera de supprimer
    await queryInterface.bulkDelete('Users', { email: adminEmail }, {});
  }
};