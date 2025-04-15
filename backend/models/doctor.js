'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Doctor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Doctor profile belongs to a User
      Doctor.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'user_id',
        as: 'user'
      });

      // A Doctor can issue many Certificates
      Doctor.hasMany(models.Certificate, {
        foreignKey: 'doctor_id',
        as: 'certificatesIssued'
      });
    }
  }

  Doctor.init({
    doctor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    agrement_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    office_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    temp_password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    temp_password_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Doctor',
    tableName: 'Doctors',
    timestamps: true
  });

  return Doctor;
};