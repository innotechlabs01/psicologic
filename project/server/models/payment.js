// models/payment.js
import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./user.js";

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paymentId: {
    type: DataTypes.STRING, // ID de Mercado Pago
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "failure"),
    defaultValue: "pending",
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  nextPaymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  blockedPaymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: { 
    type: DataTypes.DATE, 
    allowNull: false, 
    defaultValue: DataTypes.NOW 
  },
  updatedAt: { 
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['paymentDate']
    }
  ]
});

Payment.belongsTo(User, { foreignKey: "userId" });

export default Payment;
