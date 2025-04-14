'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'password_reset_token', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn('Users', 'password_reset_expires', {
      type: Sequelize.DATE, // TIMESTAMPTZ
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'password_reset_token');
    await queryInterface.removeColumn('Users', 'password_reset_expires');
  }
};
