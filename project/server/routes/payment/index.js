// routes/paymentRoutes.js
import express  from "express";
import User from "../../models/user.js";
import Payment from "../../models/payment.js";

const router = express.Router();

// ==== Crear orden de pago ====
router.post("/checkout", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "userId y amount son requeridos" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const preference = {
      items: [
        {
          title: "Suscripción mensual",
          unit_price: Number(amount),
          quantity: 1,
        },
      ],
      back_urls: {
        success: process.env.MP_SUCCESS_URL || "http://localhost:3000/success",
        failure: process.env.MP_FAILURE_URL || "http://localhost:3000/failure",
        pending: process.env.MP_PENDING_URL || "http://localhost:3000/pending",
      },
      auto_return: "approved",
      payer: {
        email: user.email,
      },
    };
    
    // Usa el cliente de Mercado Pago que guardaste globalmente
    const { client } = req.app.locals.mercadopago;

    const response = await client.create({ body: preference });

    res.json({ id: response.body.id, init_point: response.body.init_point });
  } catch (err) {
    console.error("❌ Error creando preferencia:", err);
    res.status(500).json({ error: "Error creando pago" });
  }
});

// ==== Webhook ====
router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment" && data.id) {
      const { client } = req.app.locals.mercadopago;
      const resp = await client.payment.findById({ id: data.id });

      const { status, transaction_amount: amount, payer } = resp.body;
      const email = payer?.email;

      if (!email) {
        console.warn("⚠️ Pago recibido sin email");
        return res.sendStatus(200);
      }

      const user = await User.findOne({ where: { email } });

      if (user) {
        const now = new Date();
        const nextPaymentDate =
          status === "approved"
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días
            : null;

        const blockedPaymentDate =
          status === "approved"
            ? new Date(now.getTime() + (30 + 5) * 24 * 60 * 60 * 1000) // +35 días
            : null;

        // Evita duplicados con upsert
        await Payment.upsert({
          paymentId: data.id,
          userId: user.id,
          amount,
          status,
          paymentDate: now,
          nextPaymentDate,
          blockedPaymentDate,
          createdAt: now,
        });

        user.suspense = status === "approved";
        await user.save();
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});

// ==== Obtener pagos ====
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.params.email
      }
    });
    const payments = await Payment.findAll({
      where: {
        userId: user.id
      },
      order: [
        ['paymentDate', 'DESC']
      ]
    });
    if(payments.length === 0) {
      return res.status(404).json({ error: "No se encontraron pagos" });
    }
    res.json(payments);
  } catch (err) {
    console.error("❌ Error obteniendo pagos:", err);
    res.status(500).json({ error: "Error obteniendo pagos" });
  }
});


export default router;
