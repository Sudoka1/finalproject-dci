import "dotenv/config"; // 📌 Загрузка переменных из .env
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import csrf from "csurf";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import adminOrderRoutes from "./routes/adminOrders.js";
import adminUserRoutes from "./routes/adminUsers.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true,
  })
);

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: false, // true if HTTPS
    sameSite: "Lax",
  },
});

// ✅ Skip CSRF for auth routes
const csrfExcludedRoutes = ["/api/auth/register", "/api/auth/login"];
app.use((req, res, next) => {
  if (csrfExcludedRoutes.includes(req.path)) {
    return next();
  }
  csrfProtection(req, res, next);
});

// CSRF Token Route
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Error Handling for CSRF
app.use((err, req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") return next(err);
  res.status(403).json({ message: "Invalid CSRF Token" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
