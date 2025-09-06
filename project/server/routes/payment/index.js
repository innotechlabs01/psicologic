// routes/paymentRoutes.js
import express from "express";
import User from "../../models/user.js";
import Payment from "../../models/payment.js";
import { authenticateJWT } from "../../middlewares/auth.js";

const router = express.Router();

// ===== Endpoints de pagos específicos =====

router.get("/success", (req, res) => { 
  res.sendFile('success.html', { root: path.join(process.cwd(), 'project/public') }); 
});

router.get("/failure", (req, res) => { 
  res.sendFile('failure.html', { root: path.join(process.cwd(), 'project/public') }); 
});

router.get("/pending", (req, res) => { 
  res.sendFile('pending.html', { root: path.join(process.cwd(), 'project/public') }); 
});

router.get("/payment-status/:paymentId", authenticateJWT, async (req, res) => {
  try {
    const { paymentId } = req.params;
    console.log(`📍 Buscando información del pago: ${paymentId}`);

    const payment = await Payment.findOne({
      where: { paymentId },
      include: [{
        model: User,
        attributes: ['id', 'email', 'name', 'suspended']
      }]
    });

    if (!payment) {
      console.warn(`❌ Pago no encontrado: ${paymentId}`);
      return res.status(404).json({
        error: "Pago no encontrado",
        message: "El pago solicitado no existe en el sistema"
      });
    }

    if (payment.userId !== req.user.id && req.user.role !== 'admin') {
      console.warn(`⚠️ Intento de acceso no autorizado al pago ${paymentId} por usuario ${req.user.id}`);
      return res.status(403).json({
        error: "Acceso denegado",
        message: "No tienes permiso para ver este pago"
      });
    }

    const response = {
      id: payment.id,
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      nextPaymentDate: payment.nextPaymentDate,
      blockedPaymentDate: payment.blockedPaymentDate,
      user: {
        id: payment.User.id,
        email: payment.User.email,
        name: payment.User.name,
        suspended: payment.User.suspended
      }
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error al obtener estado del pago:", err);
    res.status(500).json({
      error: "Error del servidor",
      message: "Hubo un error al procesar tu solicitud"
    });
  }
});

router.post('/paymentFail', authenticateJWT, async (req, res) => {
  try {
    const { userId, paymentId, status } = req.body;

    const payment = await Payment.findOne({
      where: {
        userId: userId,
      }
    });

    let statusPayment = status;

    const now = new Date();
    const expirationDate = payment.blockedPaymentDate;
    const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 5) {
     statusPayment = 'warning';
      // Aquí puedes buscar el usuario si tienes el email o preferenceId
      await Payment.create({
        userId: userId,
        paymentId: paymentId,
        amount: 100000,
        status: statusPayment,
        suspense: false,
        paymentDate: new Date(),
        nextPaymentDate: payment.nextPaymentDate,
        blockedPaymentDate: payment.blockedPaymentDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (daysRemaining < 0) {
      statusPayment = 'expired';
      // Aquí puedes buscar el usuario si tienes el email o preferenceId
      await Payment.create({
        userId: userId,
        paymentId: paymentId,
        amount: 100000,
        status: statusPayment,
        suspense: false,
        paymentDate: new Date(),
        nextPaymentDate: payment.nextPaymentDate,
        blockedPaymentDate: payment.blockedPaymentDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await User.update({
        suspended: true,
      }, {
        where: {
          id: userId,
        }
      });
    } else {
      // Aquí puedes buscar el usuario si tienes el email o preferenceId
      await Payment.create({
        userId: userId,
        paymentId: paymentId,
        amount: 100000,
        status: statusPayment,
        paymentDate: new Date(),
        nextPaymentDate: payment.nextPaymentDate,
        blockedPaymentDate: payment.blockedPaymentDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('📌 Pago fallido registrado');
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error al registrar pago fallido:', error);
    res.sendStatus(500);
  }
});


// ===== Endpoints de suscripción =====

router.get("/status/:userId", authenticateJWT, async (req, res) => {
  try {
    if (req.params.userId != req.user.id && req.user.role !== 'admin') {
      console.warn(`⚠️ Intento de acceso no autorizado a información de usuario ${req.params.userId} por usuario ${req.user.id}`);
      return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
    }

    console.log("Paso el If de autenticación");

    const user = await User.findOne({
      where: {
        id: req.params.userId,
        suspended: false,
      },
    });

    console.log('Usuario encontrado para estado de suscripción:', user ? user.email : 'No encontrado');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const payment = await Payment.findAll({
      where: {
        userId: req.params.userId
      },
      order: [['paymentDate', 'DESC']],
    });

    const jsonPayment = [];
    if (payment.length > 0) {
      payment.forEach(p => {
        const now = new Date();
        const expirationDate = p.dataValues.blockedPaymentDate;
        let daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

        let status = 'active';
        if (daysRemaining <= 5 && daysRemaining > 0) {
          status = 'warning';
        } else if (daysRemaining <= 0) {
          status = 'expired';
        }

        daysRemaining = daysRemaining < 0 ? 0 : daysRemaining;

        jsonPayment.push({
          id: p.dataValues.id,
          paymentId: p.dataValues.paymentId,
          status: status,
          amount: p.dataValues.amount,
          paymentDate: p.dataValues.paymentDate,
          nextPaymentDate: p.dataValues.nextPaymentDate,
          blockedPaymentDate: p.dataValues.blockedPaymentDate,
          daysRemaining: Math.max(0, daysRemaining),
          email: user.email,
          name: user.name
        })
      })
    }
    res.json(jsonPayment);
  } catch (err) {
    console.error("❌ Error obteniendo estado del pago:", err);
    res.status(500).json({ error: "Error obteniendo estado del pago" });
  }
});

// ===== Endpoints de historial de pagos =====

router.get("/user/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
    }

    const payments = await Payment.findAll({
      where: { userId },
      order: [['paymentDate', 'DESC']]
    });

    res.json(payments);
  } catch (err) {
    console.error("❌ Error obteniendo pagos:", err);
    res.status(500).json({ error: "Error obteniendo pagos" });
  }
});

router.get("/:email", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.id != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
    }

    const payments = await Payment.findAll({
      where: { userId: user.id },
      order: [['paymentDate', 'DESC']]
    });
    
    res.json(payments.length ? payments : []);
  } catch (err) {
    console.error("❌ Error obteniendo pagos:", err);
    res.status(500).json({ error: "Error obteniendo pagos" });
  }
});

// ===== Endpoints de creación de pagos =====

router.post("/checkout", authenticateJWT, async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "userId y amount son requeridos" });
    }

    // Verificar permisos
    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const body = {
      payer: {
        email: user.email,
      },
      items: [
        {
          description: "Suscripción mensual",
          title: "Page Web Psicologic InnoTech Labs SAS",
          unit_price: Number(amount),
          currency_id: "COL",
          quantity: 1,
        },
      ],
      back_urls: {
        success: process.env.DOMAIN + "/success",
        failure: process.env.DOMAIN + "/failure",
        pending: process.env.DOMAIN + "/pending",
      },
      notification_url: process.env.DOMAIN + "/api/payments/webhook",
    };
    
    // En la ruta /api/payments/checkout
    const { client, Preference } = req.app.locals.mercadopago;
    const preference = new Preference(client);
    const response = await preference.create({ body });

    res.json({ id: userId, init_point: response.init_point });
  } catch (err) {
    console.error("❌ Error creando preferencia:", err);
    res.status(500).json({ error: "Error creando pago" });
  }
});

// ===== Webhook para procesar pagos =====

router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log("Webhook recibido: ", { type, data });
    console.log("Webhook recibido req.body: ", req.body);

    if (type === "payment" && data.preference_id) {
      const { client } = req.app.locals.mercadopago;
      const resp = await client.payment.findById({ id: data.id });

      const { status, transaction_amount: amount, payer, external_reference } = resp.body;
      const email = payer?.email;
      const now = new Date();

      // Buscar usuario por email o por external_reference si está disponible
      let user = null;
      if (email) {
        user = await User.findOne({ where: { email, suspended: false } });
      } else if (external_reference) {
        user = await User.findOne({ where: { external_reference } });
      }

      if (user) {
        const nextPaymentDate =
          status === "approved" ? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) : null;

        const blockedPaymentDate =
          status === "approved" ? new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000) : null;

        try {
          await Payment.create({
            paymentId: data.id,
            userId: user.id,
            amount,
            status,
            paymentDate: now,
            nextPaymentDate,
            blockedPaymentDate,
            suspense: status === "approved",
            createdAt: now,
            updatedAt: now
          });

          // Actualizar el estado del usuario si el pago fue aprobado
          if (status === "approved") {
            user.suspense = true;
            await user.save();
          }

          console.log(`✅ Pago registrado: ${status}`, {
            paymentId: data.id,
            userId: user.id,
            status,
            amount
          });
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('ℹ️ Pago ya registrado:', data.id);
          } else {
            throw error;
          }
        }
      }
    } else {
        console.warn("⚠️ Usuario no encontrado para el pago:", {
          data
        });

        // Guardar el pago sin usuario para seguimiento posterior
        await Payment.create({
          paymentId: data.id,
          userId: null,
          amount,
          status,
          paymentDate: now,
          preferenceId: data.preference_id,
          suspense: false,
          createdAt: now,
          updatedAt: now
        });

        console.log("📌 Pago sin usuario registrado, guardado para seguimiento.");
      }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});


export default router;
