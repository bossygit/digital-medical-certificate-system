'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = 'admin123'; // Changez-le immédiatement après la création
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return queryInterface.bulkInsert('Users', [{
      email: 'admin@dgtt.ma',
      password_hash: hashedPassword,
      role: 'dgtt_admin',
      first_name: 'Admin',
      last_name: 'DGTT',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', { email: 'admin@dgtt.ma' });
  }
};