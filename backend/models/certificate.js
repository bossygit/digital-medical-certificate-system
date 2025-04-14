'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Certificate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Certificate belongs to a Doctor
      Certificate.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        targetKey: 'doctor_id',
        as: 'issuingDoctor'
      });
    }
  }

  Certificate.init({
    certificate_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    applicant_first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    applicant_last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    applicant_dob: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    applicant_address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    medical_findings: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    is_fit: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    qr_code_identifier: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4
    },
    digital_signature: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'issued',
      validate: {
        isIn: {
          args: [['issued', 'verified', 'expired', 'revoked']],
          msg: "Status must be one of: issued, verified, expired, revoked"
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Certificate',
    tableName: 'Certificates',
    timestamps: true
  });

  return Certificate;
};