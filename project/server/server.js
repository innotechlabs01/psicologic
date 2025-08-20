// ==== Configuración de entorno ====
import dotenv from "dotenv";
dotenv.config();

// ==== Dependencias ====
import express from "express";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ==== DB y modelos ====
import sequelize from "./db.js";
import User from "./models/user.js";

// ==== Rutas ====
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payment/index.js";

// ==== Middlewares ====
import { authenticate } from "./middlewares/auth.js";

// ==== Inicialización express ====
const app = express();

// ==== Helpers para __dirname en ESM ====
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// ==== Middlewares globales ====

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(morgan("dev"));

// ==== Configuración Mercado Pago ====
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
app.locals.mercadopago = { client, Payment };

// ==== Archivos estáticos ====
app.use(
  express.static(path.join(__dirname, "../public"), {
    extensions: ["html", "css", "js"],
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// ==== Rutas API ====
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

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
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    res.sendFile("index.html", { root: path.join(__dirname, "../public") });
  }
});

// ==== Fallback (SPA o rutas no definidas) ====
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "../public") });
});

// ==== Inicializar servidor ====
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: true }) // ⚠️ cuidado, esto borra los datos cada vez
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Error al conectar con la base de datos:", err);
  });
