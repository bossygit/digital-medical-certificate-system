'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'; // Utiliser une variable d'env ou un mdp par défaut
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await queryInterface.bulkInsert('Users', [{
      email: process.env.ADMIN_EMAIL || 'admin@dgtt.ma', // Utiliser une variable d'env
      password_hash: hashedPassword,
      role: 'dgtt_admin', // Assurez-vous que c'est le bon rôle
      first_name: 'Admin',
      last_name: 'DGTT',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: process.env.ADMIN_EMAIL || 'admin@dgtt.ma' }, {});
  }
};