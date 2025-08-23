import dotenv from "dotenv";
import express from "express";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname } from "path";
import sequelize from "./db.js";
import User from "./models/user.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payment/index.js";
import gameRoutes from "./routes/games/index.js";
import { authenticate } from "./middlewares/auth.js";

// Load environment variables
dotenv.config();

// Helpers for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express and HTTP server
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store valid tokens for card game
const tokensValidos = new Map();

// Global middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT"],
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Demasiadas solicitudes, intenta de nuevo más tarde."
}));
app.use(express.json());
app.use(morgan("dev"));

// Mercado Pago configuration
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});
app.locals.mercadopago = { client, Payment };

// Serve static files
app.use(express.static(path.join(__dirname, "../public"), {
  extensions: ["html", "css", "js"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

app.use('/js', express.static(path.join(__dirname, "../public/js")));
app.use('/css', express.static(path.join(__dirname, "../public/css")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/games", gameRoutes);

// ==== Rutas Web ====
app.get("/user-page/:id", (req, res) => {
  res.sendFile("user-page.html", { root: path.join(__dirname, "../public") });
});

app.get(["/", "/index.html", "/register.html"], authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.user.email } });
    if (req.user.role === "admin") {
      return res.redirect("/dashboard.html");
    }
    if (user?.link) {
      return res.redirect(user.link);
    }
    res.sendFile("index.html", { root: path.join(__dirname, "../public") });
  } catch (err) {
    console.error("Error verificando usuario:", err);
    res.status(500).send("Error interno del servidor");
  }
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('validar-token', (token, callback) => {
    if (tokensValidos.has(token)) {
      tokensValidos.get(token).socketId = socket.id;
      callback({ valido: true, nombre: tokensValidos.get(token).nombre });
    } else {
      callback({ valido: false });
    }
  });

  socket.on('seleccionCartas', ({ token, cartas }) => {
    if (tokensValidos.has(token)) {
      const { nombre } = tokensValidos.get(token);
      console.log(`Cartas seleccionadas por ${nombre}:`, cartas);
      io.emit('actualizarAdmin', { nombre, cartas, token });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    for (const [token, data] of tokensValidos) {
      if (data.socketId === socket.id) {
        data.socketId = null;
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error en el servidor:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Initialize server
const PORT = process.env.PORT || 3000;
sequelize
  .sync({ force: true }) // Update schema without dropping data
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar con la base de datos:", err);
    process.exit(1);
  });