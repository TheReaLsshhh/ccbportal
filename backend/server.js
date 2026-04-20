import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();

// ==============================
// 🔧 MIDDLEWARE
// ==============================
app.use(express.json());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
  })
);

// ==============================
// 🗄️ DATABASE (SINGLE SOURCE)
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // REQUIRED for Supabase
  },
});

let dbReady = false;

// ==============================
// 🚀 INIT DATABASE
// ==============================
async function initDb() {
  try {
    console.log("🔌 Connecting to database...");
    await pool.query("SELECT 1");
    dbReady = true;
    console.log("✅ Database connected");
  } catch (err) {
    dbReady = false;
    console.error("❌ Database connection failed:", err.message);
  }
}

// Run once at startup
await initDb();

// ==============================
// 🧪 HEALTH ROUTES
// ==============================
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: dbReady ? "connected" : "not connected",
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("DB test failed:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ==============================
// 🔐 AUTH ROUTES
// ==============================
app.post("/api/login", async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({
        message: "Database not ready",
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // ⚠️ Plain text check (replace with bcrypt later)
    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==============================
// 📊 SAMPLE DATA ROUTE
// ==============================
app.get("/api/data", async (req, res) => {
  try {
    if (!dbReady) {
      return res.status(503).json({
        message: "Database not ready",
      });
    }

    const result = await pool.query("SELECT * FROM admins LIMIT 10");

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("Data fetch error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==============================
// ⚠️ ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
  });
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});