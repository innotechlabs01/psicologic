// models/payment.js
import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./user.js";

const Payment = sequelize.define("Payment", {
  paymentId: {
    type: DataTypes.STRING, // ID de Mercado Pago
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
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
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

Payment.belongsTo(User, { foreignKey: "userId" });

export default Payment;
