const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { v2: cloudinary } = require('cloudinary');
const logger = require('./utils/logger');
const { validationRules, validate } = require('./middleware/validation');
const { broadcastDataChange } = require('./utils/realtimeUtils');

// Load env vars from root .env BEFORE importing services
dotenv.config({ path: path.join(__dirname, '../.env') });

const brevoService = require('./services/brevoService');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MEDIA_ROOT = path.join(__dirname, '../media');
const IMAGE_UPLOAD_ROOT = path.join(MEDIA_ROOT, 'images');
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

fs.mkdirSync(IMAGE_UPLOAD_ROOT, { recursive: true });

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.brevo.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://ccb-eacademy.onrender.com'
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use('/media', express.static(MEDIA_ROOT));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Database Setup (PostgreSQL)
let pool = null;
let dbReady = false;


function getPgConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const cfg = {
      connectionString: databaseUrl,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
    const pwd = process.env.PGPASSWORD;
    if (typeof pwd === 'string' && pwd.length > 0) cfg.password = pwd;
    return cfg;
  }

  const cfg = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    database: process.env.PGDATABASE || 'ccb_portal_db'
  };
  const pwd = process.env.PGPASSWORD;
  if (typeof pwd === 'string' && pwd.length > 0) cfg.password = pwd;
  return cfg;
}


async function ensureDatabaseExists() {
  const cfg = getPgConfig();
  if (cfg.connectionString) return;
  const dbName = cfg.database;
  const adminClient = new Client({ ...cfg, database: 'postgres' });
  await adminClient.connect();
  const exists = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
  if (exists.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  }
  await adminClient.end();
}

async function initDb() {
  try {
    await ensureDatabaseExists();
    pool = new Pool(getPgConfig());
    await pool.query('SELECT 1');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id BIGSERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        subject TEXT,
        message TEXT,
        verification_token TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        details TEXT,
        event_date DATE,
        start_time TIME,
        end_time TIME,
        location TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        details TEXT,
        date DATE NOT NULL,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date DATE NOT NULL,
        body TEXT NOT NULL,
        details TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        details TEXT,
        achievement_date DATE,
        category TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS academic_programs (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        degree_type TEXT,
        duration_years INTEGER DEFAULT 4,
        total_units INTEGER DEFAULT 120,
        with_enhancements INTEGER DEFAULT 0,
        program_overview TEXT,
        core_courses TEXT,
        career_prospects TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add missing columns to existing academic_programs table
    try {
      await pool.query(`ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS program_overview TEXT`);
      await pool.query(`ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS core_courses TEXT`);
      await pool.query(`ALTER TABLE academic_programs ADD COLUMN IF NOT EXISTS career_prospects TEXT`);
    } catch (err) {
      logger.debug('Database columns may already exist:', err.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        department_type TEXT DEFAULT 'academic',
        description TEXT,
        office_location TEXT,
        phone TEXT,
        email TEXT,
        head_name TEXT,
        head_title TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id BIGSERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT,
        department_id INTEGER REFERENCES departments(id),
        email TEXT,
        phone TEXT,
        bio TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admission_requirements (
        id BIGSERIAL PRIMARY KEY,
        category TEXT DEFAULT 'new-scholar',
        requirement_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollment_steps (
        id BIGSERIAL PRIMARY KEY,
        category TEXT DEFAULT 'new-scholar',
        step_number INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admission_notes (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        note_text TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS institutional_info (
        id BIGSERIAL PRIMARY KEY,
        vision TEXT,
        mission TEXT,
        goals TEXT,
        core_values TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS downloads (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'other',
        file_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    dbReady = true;
    logger.info('Connected to PostgreSQL database successfully.');

  } catch (err) {
    logger.error('Error initializing database:', err);
    if (String(err?.message || '').includes('client password must be a string')) {
      logger.error('Set DATABASE_URL (with password) or set PGPASSWORD in your local .env.');
    }
    dbReady = false;
  }
}

// Initialize DB on startup
initDb();

// Database helper functions
function getDatabase() {
  return pool;
}

function isDatabaseReady() {
  return dbReady;
}

// Single database helper functions for PostgreSQL
async function insertIntoDatabase(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(query, values);
  return result;
}

async function updateDatabase(table, data, whereCondition, whereParams) {
  const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), ...whereParams];
  const whereClauseWithParams = whereCondition.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + Object.keys(data).length}`);
  
  const query = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE ${whereClauseWithParams} RETURNING *`;
  const result = await pool.query(query, values);
  return result;
}

async function deleteFromDatabase(table, whereCondition, whereParams) {
  const query = `DELETE FROM ${table} WHERE ${whereCondition} RETURNING *`;
  const result = await pool.query(query, whereParams);
  return result;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
}

function withImageField(row) {
  if (!row) return row;
  return {
    ...row,
    image: row.image_url || null
  };
}

function isCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function getCloudinaryPublicId(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  try {
    const url = new URL(imageUrl);
    if (!url.hostname.includes('res.cloudinary.com')) return null;

    const uploadMarker = '/upload/';
    const uploadIndex = url.pathname.indexOf(uploadMarker);
    if (uploadIndex === -1) return null;

    let assetPath = url.pathname.slice(uploadIndex + uploadMarker.length);
    assetPath = assetPath.replace(/^v\d+\//, '');
    assetPath = assetPath.replace(/\.[^.\/]+$/, '');
    return assetPath || null;
  } catch (_) {
    return null;
  }
}

async function saveUploadedImage(file, prefix) {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    const originalName = file.originalname || `${prefix}-${Date.now()}`;
    const publicIdBase = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const publicId = `${prefix}-${Date.now()}-${publicIdBase || uuidv4()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ccbportal',
          public_id: publicId,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result?.secure_url || null);
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  const originalExt = path.extname(file.originalname || '');
  const mimeExt = file.mimetype && file.mimetype.includes('/')
    ? `.${file.mimetype.split('/')[1].split('+')[0]}`
    : '';
  const extension = originalExt || mimeExt || '.jpg';
  const fileName = `${prefix}-${Date.now()}-${uuidv4()}${extension}`;
  const fullPath = path.join(IMAGE_UPLOAD_ROOT, fileName);

  await fs.promises.writeFile(fullPath, file.buffer);

  return `/media/images/${fileName}`;
}

async function deleteManagedImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return;
  }

  const publicId = getCloudinaryPublicId(imageUrl);
  if (publicId && isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
      logger.warn('Failed to delete Cloudinary image', { imageUrl, error: err.message });
    }
    return;
  }

  if (!imageUrl.startsWith('/media/')) {
    return;
  }

  const relativePath = imageUrl.replace(/^\/media\//, '').replace(/\//g, path.sep);
  const fullPath = path.join(MEDIA_ROOT, relativePath);

  try {
    await fs.promises.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn('Failed to delete managed image', { imageUrl, error: err.message });
    }
  }
}

// Brevo Email Service is imported and ready to use

// Routes

app.get('/api/health/db', async (req, res) => {
  try {
    const pgReady = dbReady && pool;
    const currentReady = isDatabaseReady();
    
    return res.json({ 
      ok: currentReady, 
      postgres: { ready: pgReady },
      current: 'postgresql'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const ADMIN_TOKEN_COOKIE = 'ccb_admin_token';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-jwt-secret';
}

async function requireAdmin(req, res, next) {
  try {
    if (!dbReady || !pool) return res.status(503).json({ authenticated: false, message: 'Database not ready' });
    const token = req.cookies?.[ADMIN_TOKEN_COOKIE];
    if (!token) return res.status(401).json({ authenticated: false });
    const payload = jwt.verify(token, getJwtSecret());
    req.admin = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ authenticated: false });
  }
}

app.post('/api/admin/setup/', async (req, res) => {
  try {
    if (!dbReady || !pool) return res.status(503).json({ status: 'error', message: 'Database not ready' });
    const { username, password, setupKey } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing username or password' });
    }

    const configuredKey = process.env.ADMIN_SETUP_KEY;
    const existingRows = await pool.query(`SELECT COUNT(*)::int AS cnt FROM admin_users`);
    const existingCount = Number(existingRows?.rows?.[0]?.cnt || 0);

    if (configuredKey) {
      if (!setupKey || setupKey !== configuredKey) {
        return res.status(403).json({ status: 'error', message: 'Invalid setup key' });
      }
    } else {
      if (existingCount > 0) {
        return res.status(403).json({ status: 'error', message: 'Admin already exists. Set ADMIN_SETUP_KEY to create more.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(`INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)`, [username, passwordHash]);

    return res.json({ status: 'success', message: 'Admin account created.' });
  } catch (err) {
    if (String(err?.code) === '23505') {
      return res.status(409).json({ status: 'error', message: 'Username already exists' });
    }
    logger.error('Admin setup error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create admin account' });
  }
});

app.post('/api/admin/login/', async (req, res) => {
  try {
    if (!dbReady || !pool) return res.status(503).json({ status: 'error', message: 'Database not ready' });
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing username or password' });
    }

    const rows = await pool.query(`SELECT * FROM admin_users WHERE username = $1 LIMIT 1`, [username]);
    const admin = rows?.rows?.[0];
    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: String(admin.id), username: admin.username },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.cookie(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ 
      status: 'success', 
      message: 'Logged in',
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (err) {
    logger.error('Admin login error:', err);
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
});

app.get('/api/admin/auth-check/', requireAdmin, async (req, res) => {
  return res.json({ 
    status: 'success', 
    authenticated: true, 
    user: {
      id: req.admin.sub,
      username: req.admin.username
    },
    session_expiry: 1800,
    session_warning_time: 300
  });
});

app.post('/api/admin/logout/', (req, res) => {
  res.clearCookie(ADMIN_TOKEN_COOKIE, { httpOnly: true, sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
  return res.json({ status: 'success', message: 'Logged out' });
});

// Debug endpoints to check database
app.get('/api/debug/info/', async (req, res) => {
  try {
    const cfg = getPgConfig();
    res.json({ 
      status: 'success', 
      database: {
        name: cfg.database,
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        hasConnectionString: !!cfg.connectionString
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get database info', error: err.message });
  }
});

app.get('/api/debug/admin/academic-programs/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM academic_programs ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', programs: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch academic programs', error: err.message });
  }
});

app.get('/api/debug/news/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, news: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch news', error: err.message });
  }
});

app.get('/api/debug/academic-programs/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM academic_programs ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, programs: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch academic programs', error: err.message });
  }
});

app.get('/api/debug/departments/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, departments: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch departments', error: err.message });
  }
});

app.get('/api/debug/personnel/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personnel ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, personnel: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch personnel', error: err.message });
  }
});

app.get('/api/debug/admission-requirements/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admission_requirements ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, requirements: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch admission requirements', error: err.message });
  }
});

app.get('/api/debug/enrollment-steps/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enrollment_steps ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, steps: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch enrollment steps', error: err.message });
  }
});

app.get('/api/debug/admission-notes/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admission_notes ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, notes: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch admission notes', error: err.message });
  }
});

app.get('/api/debug/institutional-info/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM institutional_info ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, info: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch institutional info', error: err.message });
  }
});

app.get('/api/debug/downloads/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM downloads ORDER BY created_at DESC LIMIT 5');
    res.json({ status: 'success', count: result.rows.length, downloads: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch downloads', error: err.message });
  }
});

// 1. Public API Endpoints (for frontend)

// Public news endpoint
app.get('/api/news/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news WHERE is_active = TRUE ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', news: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch news' });
  }
});

// Public events endpoint
app.get('/api/events/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE is_active = TRUE ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', events: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch events' });
  }
});

// Public announcements endpoint
app.get('/api/announcements/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements WHERE is_active = TRUE ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', announcements: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch announcements' });
  }
});

// Public achievements endpoint
app.get('/api/achievements/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements WHERE is_active = TRUE ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', achievements: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch achievements' });
  }
});

// Public academic programs endpoint
app.get('/api/academic-programs/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name as title,
        description,
        degree_type,
        duration_years::text || ' years' as duration_text,
        total_units::text as units_text,
        with_enhancements::text as enhancements_text,
        program_overview,
        core_courses,
        career_prospects,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM academic_programs 
      WHERE is_active = true 
      ORDER BY display_order, created_at DESC
    `);
    const programs = result.rows.map((row) => ({
      ...row,
      core_courses: typeof row.core_courses === 'string'
        ? row.core_courses.split('\n').map((course) => course.trim()).filter(Boolean)
        : Array.isArray(row.core_courses)
          ? row.core_courses
          : []
    }));
    res.json({ status: 'success', programs });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch academic programs' });
  }
});

// 2. Admin CRUD Endpoints

// Events endpoints
app.get('/api/admin/events/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', events: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch events' });
  }
});

app.post('/api/admin/events/create/', requireAdmin, upload.single('image'), validate(validationRules.event), async (req, res) => {
  try {
    const { title, description, details, event_date, start_time, end_time, location, is_active, display_order } = req.body;
    const imageUrl = await saveUploadedImage(req.file, 'event');
    
    const eventData = {
      title: title,
      description: description || null,
      details: details || null,
      event_date: event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: display_order || 0
    };

    const result = await insertIntoDatabase('events', eventData);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create event' });
    }

    logger.info('Event created successfully', { eventId: result.rows[0].id, title: title });
    broadcastDataChange('events', 'create', result.rows[0]);
    return res.status(201).json({
      status: 'success',
      event: withImageField(result.rows[0])
    });
  } catch (err) {
    logger.error('Event creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create event: ' + err.message });
  }
});

// Events UPDATE endpoint
app.put('/api/admin/events/:id/', requireAdmin, upload.single('image'), validate(validationRules.event), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, details, event_date, start_time, end_time, location, is_active, display_order, remove_image } = req.body;
    const existing = await pool.query('SELECT image_url FROM events WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or update failed' });
    }

    let imageUrl = existing.rows[0].image_url || null;
    if (parseBoolean(remove_image, false)) {
      await deleteManagedImage(imageUrl);
      imageUrl = null;
    }
    if (req.file) {
      await deleteManagedImage(imageUrl);
      imageUrl = await saveUploadedImage(req.file, 'event');
    }
    
    const updateData = {
      title: title,
      description: description || null,
      details: details || null,
      event_date: event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: display_order || 0
    };

    const result = await updateDatabase('events', updateData, 'id = $1', [parseInt(id)]);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or update failed' });
    }

    logger.info('Event updated successfully', { eventId: id, title: title });
    broadcastDataChange('events', 'update', result.rows[0]);
    return res.json({
      status: 'success',
      event: withImageField(result.rows[0])
    });
  } catch (err) {
    logger.error('Event update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update event: ' + err.message });
  }
});

// Events DELETE endpoint
app.delete('/api/admin/events/:id/', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteFromDatabase('events', 'id = $1', [parseInt(id)]);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or already deleted' });
    }

    await deleteManagedImage(result.rows[0].image_url);

    logger.info('Event deleted successfully', { eventId: id });
    broadcastDataChange('events', 'delete', { id: parseInt(id) });
    return res.json({
      status: 'success',
      deleted_event: result.rows[0]
    });
  } catch (err) {
    logger.error('Event deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete event: ' + err.message });
  }
});

// News endpoints
app.get('/api/admin/news/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', news: result.rows.map(withImageField) });
  } catch (err) {
    logger.error('Failed to fetch news:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch news' });
  }
});

app.post('/api/admin/news/create/', requireAdmin, upload.single('image'), validate(validationRules.news), async (req, res) => {
  try {
    const { title, body, details, date, is_active, display_order } = req.body;
    const imageUrl = await saveUploadedImage(req.file, 'news');
    
    const newsData = {
      title: title,
      body: body,
      details: details || null,
      date: date,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: display_order || 0
    };

    const result = await insertIntoDatabase('news', newsData);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create news article' });
    }

    logger.info('News created successfully', { newsId: result.rows[0].id, title: title });
    broadcastDataChange('news', 'create', result.rows[0]);
    return res.status(201).json({
      status: 'success',
      news: withImageField(result.rows[0])
    });
  } catch (err) {
    logger.error('News creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create news: ' + err.message });
  }
});

// News UPDATE endpoint
app.put('/api/admin/news/:id/', requireAdmin, upload.single('image'), validate(validationRules.news), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, details, date, is_active, display_order, remove_image } = req.body;
    const existing = await pool.query('SELECT image_url FROM news WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'News not found or update failed' });
    }

    let imageUrl = existing.rows[0].image_url || null;
    if (parseBoolean(remove_image, false)) {
      await deleteManagedImage(imageUrl);
      imageUrl = null;
    }
    if (req.file) {
      await deleteManagedImage(imageUrl);
      imageUrl = await saveUploadedImage(req.file, 'news');
    }
    
    const updateData = {
      title: title,
      body: body,
      details: details || null,
      date: date,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: display_order || 0
    };

    const result = await updateDatabase('news', updateData, 'id = $1', [parseInt(id)]);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found or update failed' });
    }

    logger.info('News updated successfully', { newsId: id, title: title });
    broadcastDataChange('news', 'update', result.rows[0]);
    res.json({ 
      status: 'success', 
      news: withImageField(result.rows[0])
    });
  } catch (err) {
    logger.error('News update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update news: ' + err.message });
  }
});

// News DELETE endpoint
app.delete('/api/admin/news/:id/', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteFromDatabase('news', 'id = $1', [parseInt(id)]);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found or already deleted' });
    }

    await deleteManagedImage(result.rows[0].image_url);

    logger.info('News deleted successfully', { newsId: id });
    broadcastDataChange('news', 'delete', { id: parseInt(id) });
    res.json({ 
      status: 'success', 
      message: 'News deleted successfully',
      deleted_news: result.rows[0]
    });
  } catch (err) {
    logger.error('News deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete news: ' + err.message });
  }
});

// Announcements endpoints
app.get('/api/admin/announcements/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', announcements: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch announcements' });
  }
});

app.post('/api/admin/announcements/create/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Announcements Create - Request body:', req.body);
    const { title, date, body, details, is_active, display_order } = req.body;
    
    if (!title || !date || !body) {
      console.log('Announcements Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title, date, and body are required' });
    }
    
    console.log('Announcements Create - Creating announcement:', { title, date, body, details, is_active, display_order });
    
    const imageUrl = await saveUploadedImage(req.file, 'announcement');

    const announcementData = {
      title: title,
      date: date,
      body: body,
      details: details,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('announcements', announcementData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create announcement' });
    }

    console.log('Announcements Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      announcement: withImageField(result.rows[0])
    });
  } catch (err) {
    console.error('Announcement creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create announcement: ' + err.message });
  }
});

// Announcements UPDATE endpoint
app.put('/api/admin/announcements/:id/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Announcements Update - Request body:', req.body);
    const { id } = req.params;
    const { title, date, body, details, is_active, display_order, remove_image } = req.body;
    
    if (!title || !date || !body) {
      console.log('Announcements Update - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title, date, and body are required' });
    }
    
    console.log('Announcements Update - Updating announcement:', { id, title, date, body, details, is_active, display_order });
    
    const existing = await pool.query('SELECT image_url FROM announcements WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or update failed' });
    }

    let imageUrl = existing.rows[0].image_url || null;
    if (parseBoolean(remove_image, false)) {
      await deleteManagedImage(imageUrl);
      imageUrl = null;
    }
    if (req.file) {
      await deleteManagedImage(imageUrl);
      imageUrl = await saveUploadedImage(req.file, 'announcement');
    }

    const updateData = {
      title: title,
      date: date,
      body: body,
      details: details,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await updateDatabase('announcements', updateData, 'id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or update failed' });
    }

    console.log('Announcements Update - Successfully updated:', result.rows[0]);
    res.json({ 
      status: 'success', 
      announcement: withImageField(result.rows[0])
    });
  } catch (err) {
    console.error('Announcement update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update announcement: ' + err.message });
  }
});

// Announcements DELETE endpoint
app.delete('/api/admin/announcements/:id/', requireAdmin, async (req, res) => {
  try {
    console.log('Announcements Delete - ID:', req.params.id);
    const { id } = req.params;
    
    console.log('Announcements Delete - Deleting announcement:', { id });
    
    const result = await deleteFromDatabase('announcements', 'id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or already deleted' });
    }

    await deleteManagedImage(result.rows[0].image_url);

    console.log('Announcements Delete - Successfully deleted:', result.rows[0]);
    res.json({ 
      status: 'success', 
      message: 'Announcement deleted successfully',
      deleted_announcement: result.rows[0]
    });
  } catch (err) {
    console.error('Announcement deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete announcement: ' + err.message });
  }
});

// Achievements endpoints
app.get('/api/admin/achievements/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', achievements: result.rows.map(withImageField) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch achievements' });
  }
});

app.post('/api/admin/achievements/create/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Achievements Create - Request body:', req.body);
    const { title, description, details, achievement_date, category, is_active, display_order } = req.body;
    
    if (!title || !achievement_date) {
      console.log('Achievements Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title and achievement date are required' });
    }
    
    console.log('Achievements Create - Creating achievement:', { title, description, details, achievement_date, category, is_active, display_order });
    
    const imageUrl = await saveUploadedImage(req.file, 'achievement');

    const achievementData = {
      title: title,
      description: description,
      details: details,
      achievement_date: achievement_date,
      category: category,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('achievements', achievementData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create achievement' });
    }

    console.log('Achievements Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      achievement: withImageField(result.rows[0])
    });
  } catch (err) {
    console.error('Achievement creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create achievement: ' + err.message });
  }
});

app.put('/api/admin/achievements/:id/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, details, achievement_date, category, is_active, display_order, remove_image } = req.body;

    if (!title || !achievement_date) {
      return res.status(400).json({ status: 'error', message: 'Title and achievement date are required' });
    }

    const existing = await pool.query('SELECT image_url FROM achievements WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found or update failed' });
    }

    let imageUrl = existing.rows[0].image_url || null;
    if (parseBoolean(remove_image, false)) {
      await deleteManagedImage(imageUrl);
      imageUrl = null;
    }
    if (req.file) {
      await deleteManagedImage(imageUrl);
      imageUrl = await saveUploadedImage(req.file, 'achievement');
    }

    const updateData = {
      title,
      description,
      details,
      achievement_date,
      category,
      image_url: imageUrl,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };

    const result = await updateDatabase('achievements', updateData, 'id = $1', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found or update failed' });
    }

    res.json({
      status: 'success',
      achievement: withImageField(result.rows[0])
    });
  } catch (err) {
    console.error('Achievement update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update achievement: ' + err.message });
  }
});

app.delete('/api/admin/achievements/:id/', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFromDatabase('achievements', 'id = $1', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found or already deleted' });
    }

    await deleteManagedImage(result.rows[0].image_url);

    res.json({
      status: 'success',
      deleted_achievement: withImageField(result.rows[0])
    });
  } catch (err) {
    console.error('Achievement deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete achievement: ' + err.message });
  }
});

// Academic Programs endpoints
app.get('/api/admin/academic-programs/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name as title,
        name as short_title,
        description,
        degree_type,
        duration_years,
        total_units,
        with_enhancements,
        program_overview,
        core_courses,
        career_prospects,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM academic_programs 
      ORDER BY display_order, created_at DESC
    `);
    res.json({ status: 'success', programs: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch academic programs' });
  }
});

app.post('/api/admin/academic-programs/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Academic Programs Create - Request body:', req.body);
    const { title, short_title, program_type, description, duration_years, total_units, with_enhancements, program_overview, core_courses, career_prospects, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Academic Programs Create - Missing title');
      return res.status(400).json({ status: 'error', message: 'Program title is required' });
    }
    
    console.log('Academic Programs Create - Creating academic program:', { title, short_title, program_type, description, duration_years, total_units, with_enhancements, program_overview, core_courses, career_prospects, is_active, display_order });
    
    const programData = {
      name: title,
      description: description,
      degree_type: program_type || 'BS',
      duration_years: parseInt(duration_years) || 4,
      total_units: parseInt(total_units) || 120,
      with_enhancements: parseInt(with_enhancements) || 0,
      program_overview: program_overview || '',
      core_courses: core_courses || '',
      career_prospects: career_prospects || '',
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('academic_programs', programData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create academic program' });
    }

    console.log('Academic Programs Create - Successfully created:', result.rows[0]);
    const responseProgram = {
      ...result.rows[0],
      title: result.rows[0].name,
      short_title: result.rows[0].name
    };
    res.json({ 
      status: 'success', 
      program: responseProgram
    });
  } catch (err) {
    console.error('Academic program creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create academic program: ' + err.message });
  }
});

app.put('/api/admin/academic-programs/:id/', requireAdmin, async (req, res) => {
  try {
    console.log('Academic Programs Update - Request body:', req.body);
    const { id } = req.params;
    const { title, short_title, program_type, description, duration_years, total_units, with_enhancements, program_overview, core_courses, career_prospects, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Academic Programs Update - Missing title');
      return res.status(400).json({ status: 'error', message: 'Program title is required' });
    }
    
    console.log('Academic Programs Update - Updating academic program:', { id, title, short_title, program_type, description, duration_years, total_units, with_enhancements, program_overview, core_courses, career_prospects, is_active, display_order });
    
    const updateData = {
      name: title,
      description: description,
      degree_type: program_type || 'BS',
      duration_years: parseInt(duration_years) || 4,
      total_units: parseInt(total_units) || 120,
      with_enhancements: parseInt(with_enhancements) || 0,
      program_overview: program_overview || '',
      core_courses: core_courses || '',
      career_prospects: career_prospects || '',
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await updateDatabase('academic_programs', updateData, 'id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Academic program not found or update failed' });
    }

    console.log('Academic Programs Update - Successfully updated:', result.rows[0]);
    const responseProgram = {
      ...result.rows[0],
      title: result.rows[0].name,
      short_title: result.rows[0].name
    };
    res.json({ 
      status: 'success', 
      program: responseProgram
    });
  } catch (err) {
    console.error('Academic program update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update academic program: ' + err.message });
  }
});

app.delete('/api/admin/academic-programs/:id/', requireAdmin, async (req, res) => {
  try {
    console.log('Academic Programs Delete - ID:', req.params.id);
    const { id } = req.params;
    
    console.log('Academic Programs Delete - Deleting program:', { id });
    
    const result = await deleteFromDatabase('academic_programs', 'id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Academic program not found or already deleted' });
    }

    console.log('Academic Programs Delete - Successfully deleted:', result.rows[0]);
    res.json({ 
      status: 'success', 
      message: 'Academic program deleted successfully',
      deleted_program: result.rows[0]
    });
  } catch (err) {
    console.error('Academic program deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete academic program: ' + err.message });
  }
});

// Departments endpoints
app.get('/api/admin/departments/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', departments: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch departments' });
  }
});

app.post('/api/admin/departments/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Departments Create - Request body:', req.body);
    const { name, department_type, description, office_location, phone, email, head_name, head_title, is_active, display_order } = req.body;
    
    if (!name) {
      console.log('Departments Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Department name is required' });
    }
    
    console.log('Departments Create - Creating department:', { name, department_type, description, office_location, phone, email, head_name, head_title, is_active, display_order });
    
    const departmentData = {
      name: name,
      department_type: department_type || 'academic',
      description: description,
      office_location: office_location,
      phone: phone,
      email: email,
      head_name: head_name,
      head_title: head_title,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('departments', departmentData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create department' });
    }

    console.log('Departments Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      department: result.rows[0]
    });
  } catch (err) {
    console.error('Department creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create department: ' + err.message });
  }
});

// Personnel endpoints
app.get('/api/admin/personnel/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personnel ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', personnel: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch personnel' });
  }
});

app.post('/api/admin/personnel/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Personnel Create - Request body:', req.body);
    const { full_name, title, department_id, email, phone, bio, is_active, display_order } = req.body;
    
    if (!full_name) {
      console.log('Personnel Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Full name is required' });
    }
    
    console.log('Personnel Create - Creating personnel:', { full_name, title, department_id, email, phone, bio, is_active, display_order });
    
    const personnelData = {
      full_name: full_name,
      title: title,
      department_id: department_id ? parseInt(department_id) : null,
      email: email,
      phone: phone,
      bio: bio,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('personnel', personnelData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create personnel' });
    }

    console.log('Personnel Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      personnel: result.rows[0]
    });
  } catch (err) {
    console.error('Personnel creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create personnel: ' + err.message });
  }
});

// Admission Requirements endpoints
app.get('/api/admin/admission-requirements/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admission_requirements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', requirements: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch admission requirements' });
  }
});

app.post('/api/admin/admission-requirements/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Admission Requirements Create - Request body:', req.body);
    const { category, requirement_text, is_active, display_order } = req.body;
    
    if (!requirement_text) {
      console.log('Admission Requirements Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Requirement text is required' });
    }
    
    console.log('Admission Requirements Create - Creating admission requirement:', { category, requirement_text, is_active, display_order });
    
    const requirementData = {
      category: category || 'new-scholar',
      requirement_text: requirement_text,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('admission_requirements', requirementData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create admission requirement' });
    }

    console.log('Admission Requirements Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      requirement: result.rows[0]
    });
  } catch (err) {
    console.error('Admission requirement creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create admission requirement: ' + err.message });
  }
});

// Enrollment Steps endpoints
app.get('/api/admin/enrollment-steps/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enrollment_steps ORDER BY display_order, step_number, created_at DESC');
    res.json({ status: 'success', steps: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch enrollment steps' });
  }
});

app.post('/api/admin/enrollment-steps/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Enrollment Steps Create - Request body:', req.body);
    const { category, step_number, title, description, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Enrollment Steps Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }
    
    console.log('Enrollment Steps Create - Creating enrollment step:', { category, step_number, title, description, is_active, display_order });
    
    const stepData = {
      category: category || 'new-scholar',
      step_number: parseInt(step_number) || 1,
      title: title,
      description: description,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('enrollment_steps', stepData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create enrollment step' });
    }

    console.log('Enrollment Steps Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      step: result.rows[0]
    });
  } catch (err) {
    console.error('Enrollment step creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create enrollment step: ' + err.message });
  }
});

// Admission Notes endpoints
app.get('/api/admin/admission-notes/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admission_notes ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', notes: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch admission notes' });
  }
});

app.post('/api/admin/admission-notes/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Admission Notes Create - Request body:', req.body);
    const { title, note_text, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Admission Notes Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }
    
    console.log('Admission Notes Create - Creating admission note:', { title, note_text, is_active, display_order });
    
    const noteData = {
      title: title,
      note_text: note_text,
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('admission_notes', noteData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create admission note' });
    }

    console.log('Admission Notes Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      note: result.rows[0]
    });
  } catch (err) {
    console.error('Admission note creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create admission note: ' + err.message });
  }
});

// Institutional Info endpoints
app.get('/api/admin/institutional-info/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM institutional_info ORDER BY created_at DESC LIMIT 1');
    res.json({ status: 'success', institutional_info: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch institutional info' });
  }
});

app.post('/api/admin/institutional-info/update/', requireAdmin, async (req, res) => {
  try {
    const { vision, mission, goals, core_values, is_active } = req.body;
    
    // Check if record exists
    const existing = await pool.query('SELECT id FROM institutional_info LIMIT 1');
    
    if (existing.rows.length > 0) {
      // Update existing record
      const result = await pool.query(
        `UPDATE institutional_info SET vision = $1, mission = $2, goals = $3, core_values = $4, is_active = $5, updated_at = NOW() 
         WHERE id = $6 RETURNING *`,
        [vision, mission, goals, core_values, parseBoolean(is_active, true), existing.rows[0].id]
      );
      res.json({ status: 'success', institutional_info: result.rows[0] });
    } else {
      // Create new record
      const result = await pool.query(
        `INSERT INTO institutional_info (vision, mission, goals, core_values, is_active) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [vision, mission, goals, core_values, parseBoolean(is_active, true)]
      );
      res.json({ status: 'success', institutional_info: result.rows[0] });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update institutional info' });
  }
});

// Downloads endpoints
app.get('/api/admin/downloads/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM downloads ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', downloads: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch downloads' });
  }
});

app.post('/api/admin/downloads/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Downloads Create - Request body:', req.body);
    const { title, description, category, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Downloads Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }
    
    console.log('Downloads Create - Creating download:', { title, description, category, is_active, display_order });
    
    const downloadData = {
      title: title,
      description: description,
      category: category || 'other',
      is_active: parseBoolean(is_active, true),
      display_order: parseInt(display_order) || 0
    };
    
    const result = await insertIntoDatabase('downloads', downloadData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create download' });
    }

    console.log('Downloads Create - Successfully created:', result.rows[0]);
    res.json({ 
      status: 'success', 
      download: result.rows[0]
    });
  } catch (err) {
    console.error('Download creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create download: ' + err.message });
  }
});

// 2. Contact Form Submission
app.post('/api/contact/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!dbReady || !pool) {
    return res.status(503).json({ status: 'error', message: 'Database not ready' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  const token = uuidv4();

  try {
    const contactData = { name, email, phone, subject, message, verification_token: token };
    const result = await insertIntoDatabase('contacts', contactData);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to submit contact form' });
    }

    console.log('Contact Form - Successfully submitted:', result.rows[0]);

    // Send Verification Email
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000'; 
    const backendBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
    const verifyLink = `${backendBaseUrl}/api/contact/verify/?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; color:#333;">
        <h2>Verify your email</h2>
        <p>Hello ${name},</p>
        <p>Please click the button below to verify your email and send your message to City College of Bayawan.</p>
        <a href="${verifyLink}" style="background:#2d5a2d; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Email</a>
        <p><small>Or paste this link: ${verifyLink}</small></p>
      </div>
    `;

    try {
      await brevoService.sendContactVerification(email, name, verifyLink);
      res.json({ 
        status: 'success', 
        message: 'Verification email sent.'
      });
    } catch (emailErr) {
      console.error('Brevo email error:', emailErr);
      // Optional: Delete the record if email fails? For now we keep it.
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to send verification email.'
      });
    }

  } catch (dbErr) {
    console.error('Database error:', dbErr);
    res.status(500).json({ status: 'error', message: 'Database error' });
  }
});

// 2. Verify Email Endpoint
app.get('/api/contact/verify/', async (req, res) => {
  const { token } = req.query;
  if (!dbReady || !pool) {
    return res.status(503).send('Database not ready');
  }

  if (!token) {
    return res.status(400).send('Missing token');
  }

  try {
    const rows = await pool.query(`SELECT * FROM contacts WHERE verification_token = $1`, [token]);
    const row = rows?.rows?.[0];

    if (!row) {
      return res.status(400).send('Invalid token or submission not found.');
    }

    if (row.is_verified) {
       return res.send('Email already verified.');
    }

    // Mark verified
    await pool.query(`UPDATE contacts SET is_verified = TRUE WHERE id = $1`, [row.id]);

    // Send Admin Notification
    const adminEmail = process.env.CONTACT_INBOX || 'citycollegeofbayawan@gmail.com';
    const adminHtml = `
      <h3>New Contact Message</h3>
      <p><strong>From:</strong> ${row.name} (${row.email})</p>
      <p><strong>Phone:</strong> ${row.phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${row.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${row.message}</p>
    `;

    try {
      await brevoService.sendContactNotification({
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message
      });
      
      const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      res.send(`
        <html>
          <body style="text-align:center; padding:50px; font-family:sans-serif;">
            <h1 style="color:#2d5a2d;">Verified!</h1>
            <p>Your message has been sent successfully.</p>
            <a href="${frontendUrl}">Return to Home</a>
          </body>
        </html>
      `);
    } catch (err) {
      logger.error('Admin notification error:', err);
      res.send('Verified, but failed to notify admin. We will check the database.');
    }

  } catch (err) {
    logger.error('Verification error:', err);
    res.status(500).send('An error occurred during verification.');
  }
});

// Comprehensive Health Check Endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    if (pool && dbReady) {
      await pool.query('SELECT 1');
      healthCheck.services.database = 'healthy';
    } else {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }
  } catch (err) {
    healthCheck.services.database = 'unhealthy';
    healthCheck.status = 'unhealthy';
    healthCheck.error = err.message;
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthCheck);
});

// Legacy Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', db: dbReady ? 'ready' : 'not_ready' });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});
