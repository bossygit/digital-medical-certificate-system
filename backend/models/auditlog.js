'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // An AuditLog belongs to a User
      AuditLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'user_id',
        as: 'user' // Alias
      });
    }
  }

  AuditLog.init({
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false // FK association handles the rest
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    target_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    target_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isIP: true } // Optional: validate IP format
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'AuditLogs',
    timestamps: true, // Enable timestamps
    createdAt: 'timestamp', // Use timestamp field for creation time
    updatedAt: false // Disable updatedAt
  });

  return AuditLog;
};