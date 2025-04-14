'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Certificates', {
      certificate_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Doctors',
          key: 'doctor_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      applicant_first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      applicant_last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      applicant_dob: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      applicant_address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      issue_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      medical_findings: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_fit: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      qr_code_identifier: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      digital_signature: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'issued'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addConstraint('Certificates', {
      fields: ['status'],
      type: 'check',
      where: {
        status: ['issued', 'verified', 'expired', 'revoked']
      },
      name: 'certificates_status_check'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Certificates', 'certificates_status_check');
    await queryInterface.dropTable('Certificates');
  }
};