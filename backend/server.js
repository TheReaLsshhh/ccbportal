const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2/promise');

// Load env vars from root .env BEFORE importing services
dotenv.config({ path: path.join(__dirname, '../.env') });

const brevoService = require('./services/brevoService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ccb-eacademy.onrender.com',
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

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

// Database Setup (MySQL - XAMPP)
let mysqlPool = null;
let mysqlDbReady = false;
let useMySQL = process.env.USE_MYSQL === 'true';

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

function getMySQLConfig() {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ccb_portal_db', // Same name as PostgreSQL
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    multipleStatements: true
  };
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
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

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
    console.log('Connected to PostgreSQL database.');

  } catch (err) {
    console.error('Error initializing database:', err);
    if (String(err?.message || '').includes('client password must be a string')) {
      console.error('Set DATABASE_URL (with password) or set PGPASSWORD in your local .env.');
    }
    dbReady = false;
  }
}

async function initMySQL() {
  try {
    console.log('Initializing MySQL database...');
    
    // Create MySQL connection
    mysqlPool = mysql.createPool(getMySQLConfig());
    
    // Test connection
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();

    // Create database if not exists
    await mysqlPool.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE || 'ccb_portal_db'}\``);
    
    // Switch to the database
    await mysqlPool.query(`USE \`${process.env.MYSQL_DATABASE || 'ccb_portal_db'}\``);

    // Create tables
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        verification_token VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        details TEXT,
        date DATE NOT NULL,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        details TEXT,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        body TEXT NOT NULL,
        details TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        details TEXT,
        achievement_date DATE NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS academic_programs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        degree_type VARCHAR(50),
        duration_years INT DEFAULT 4,
        total_units INT DEFAULT 120,
        with_enhancements INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_type VARCHAR(50) DEFAULT 'academic',
        description TEXT,
        office_location VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        head_name VARCHAR(255),
        head_title VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        department_id BIGINT,
        email VARCHAR(255),
        phone VARCHAR(50),
        bio TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS admission_requirements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) DEFAULT 'new-scholar',
        requirement_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS enrollment_steps (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) DEFAULT 'new-scholar',
        step_number INT DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS admission_notes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        note_text TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS institutional_info (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        vision TEXT,
        mission TEXT,
        goals TEXT,
        core_values TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS downloads (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'other',
        file_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    mysqlDbReady = true;
    console.log('Connected to MySQL database.');

  } catch (err) {
    console.error('Error initializing MySQL database:', err);
    mysqlDbReady = false;
  }
}

// Initialize DB on startup
initDb();
if (useMySQL) {
  initMySQL();
}

// Database helper functions
function getDatabase() {
  return useMySQL ? mysqlPool : pool;
}

function isDatabaseReady() {
  return useMySQL ? mysqlDbReady : dbReady;
}

// Dual database helper functions
async function queryBothDatabases(query, params = []) {
  const results = { postgresql: null, mysql: null, errors: [] };
  
  // Query PostgreSQL
  if (dbReady && pool) {
    try {
      const result = await pool.query(query, params);
      results.postgresql = result;
    } catch (error) {
      results.errors.push(`PostgreSQL: ${error.message}`);
    }
  }
  
  // Query MySQL
  if (mysqlDbReady && mysqlPool) {
    try {
      // Convert PostgreSQL parameter syntax ($1, $2) to MySQL (?)
      const mysqlQuery = query.replace(/\$\d+/g, '?');
      const [rows] = await mysqlPool.execute(mysqlQuery, params);
      results.mysql = { rows };
    } catch (error) {
      results.errors.push(`MySQL: ${error.message}`);
    }
  }
  
  return results;
}

async function insertIntoBothDatabases(table, data) {
  const results = { postgresql: null, mysql: null, errors: [] };
  
  // Insert into PostgreSQL
  if (dbReady && pool) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(query, values);
      results.postgresql = result;
    } catch (error) {
      results.errors.push(`PostgreSQL: ${error.message}`);
    }
  }
  
  // Insert into MySQL
  if (mysqlDbReady && mysqlPool) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      const quotedColumns = columns.map(col => `\`${col}\``).join(', ');
      
      const query = `INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders})`;
      const insertResult = await mysqlPool.execute(query, values);
      const result = insertResult[0];
      
      // Get the inserted row to return
      const insertedResult = await mysqlPool.execute(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      const insertedRows = insertedResult[0];
      results.mysql = { rows: insertedRows };
    } catch (error) {
      results.errors.push(`MySQL: ${error.message}`);
    }
  }
  
  return results;
}

async function updateBothDatabases(table, data, whereCondition, whereParams) {
  const results = { postgresql: null, mysql: null, errors: [] };
  
  // Update PostgreSQL
  if (dbReady && pool) {
    try {
      const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), ...whereParams];
      const whereClauseWithParams = whereCondition.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) + Object.keys(data).length}`);
      
      const query = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE ${whereClauseWithParams} RETURNING *`;
      const result = await pool.query(query, values);
      results.postgresql = result;
    } catch (error) {
      results.errors.push(`PostgreSQL: ${error.message}`);
    }
  }
  
  // Update MySQL - find the record by name if ID-based update fails
  if (mysqlDbReady && mysqlPool) {
    try {
      let updateSuccess = false;
      
      // First try the direct ID update
      const setClause = Object.keys(data).map((key) => `\`${key}\` = ?`).join(', ');
      const values = [...Object.values(data), ...whereParams];
      const whereClauseWithParams = whereCondition.replace(/\$\d+/g, '?');
      
      const query = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClauseWithParams}`;
      const result = await mysqlPool.execute(query, values);
      const updateResult = result[0];
      
      if (updateResult.affectedRows > 0) {
        updateSuccess = true;
        // Get the updated row to return
        const selectQuery = `SELECT * FROM ${table} WHERE ${whereClauseWithParams}`;
        const selectResult = await mysqlPool.execute(selectQuery, whereParams);
        const updatedRows = selectResult[0];
        results.mysql = { rows: updatedRows };
      } else {
        // If ID-based update fails, try to find by original name (for academic_programs)
        if (table === 'academic_programs' && whereCondition.includes('id =')) {
          // Get the original record from PostgreSQL to find the original name
          const originalId = whereParams[0];
          const originalRecord = await pool.query(`SELECT name FROM academic_programs WHERE id = $1`, [originalId]);
          
          if (originalRecord.rows.length > 0) {
            const originalName = originalRecord.rows[0].name;
            const nameCheckResult = await mysqlPool.execute('SELECT id FROM academic_programs WHERE name = ?', [originalName]);
            const nameCheck = nameCheckResult[0];
            
            if (nameCheck.length > 0) {
              const mysqlId = nameCheck[0].id;
              const nameValues = [...Object.values(data), mysqlId];
              const nameUpdateResult = await mysqlPool.execute(
                `UPDATE academic_programs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                nameValues
              );
              const nameResult = nameUpdateResult[0];
              
              if (nameResult.affectedRows > 0) {
                const updatedRowsResult = await mysqlPool.execute('SELECT * FROM academic_programs WHERE id = ?', [mysqlId]);
                const updatedRows = updatedRowsResult[0];
                results.mysql = { rows: updatedRows };
                updateSuccess = true;
              }
            }
          }
        }
      }
      
      if (!updateSuccess) {
        results.errors.push('MySQL: UPDATE failed - no rows affected');
      }
    } catch (error) {
      results.errors.push(`MySQL: ${error.message}`);
    }
  }
  
  return results;
}

async function deleteFromBothDatabases(table, whereCondition, whereParams) {
  const results = { postgresql: null, mysql: null, errors: [] };
  
  // Delete from PostgreSQL
  if (dbReady && pool) {
    try {
      const query = `DELETE FROM ${table} WHERE ${whereCondition} RETURNING *`;
      const result = await pool.query(query, whereParams);
      results.postgresql = result;
    } catch (error) {
      results.errors.push(`PostgreSQL: ${error.message}`);
    }
  }
  
  // Delete from MySQL
  if (mysqlDbReady && mysqlPool) {
    try {
      const mysqlQuery = `DELETE FROM ${table} WHERE ${whereCondition.replace(/\$\d+/g, '?')}`;
      const deleteResult = await mysqlPool.execute(mysqlQuery, whereParams);
      const result = deleteResult[0];
      results.mysql = { rows: result };
    } catch (error) {
      results.errors.push(`MySQL: ${error.message}`);
    }
  }
  
  return results;
}

// Brevo Email Service is imported and ready to use

// Routes

app.get('/api/health/db', async (req, res) => {
  try {
    const pgReady = dbReady && pool;
    const mysqlReady = mysqlDbReady && mysqlPool;
    const currentReady = isDatabaseReady();
    
    return res.json({ 
      ok: currentReady, 
      postgres: { ready: pgReady },
      mysql: { ready: mysqlReady, enabled: useMySQL },
      current: useMySQL ? 'mysql' : 'postgresql'
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
    console.error('Admin setup error:', err);
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
      sameSite: 'lax',
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
    console.error('Admin login error:', err);
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
  res.clearCookie(ADMIN_TOKEN_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
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
    const result = await pool.query('SELECT * FROM news ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', news: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch news' });
  }
});

// Public events endpoint
app.get('/api/events/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', events: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch events' });
  }
});

// Public announcements endpoint
app.get('/api/announcements/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', announcements: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch announcements' });
  }
});

// Public achievements endpoint
app.get('/api/achievements/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', achievements: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch achievements' });
  }
});

// 2. Admin CRUD Endpoints

// Events endpoints
app.get('/api/admin/events/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', events: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch events' });
  }
});

app.post('/api/admin/events/create/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Events Create - Request body:', req.body);
    const { title, description, details, event_date, start_time, end_time, location, is_active, display_order } = req.body;
    
    if (!title || !event_date) {
      console.log('Events Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title and event date are required' });
    }
    
    console.log('Events Create - Inserting data into both databases:', { title, description, details, event_date, start_time, end_time, location, is_active, display_order });
    
    const eventData = {
      title: title,
      description: description,
      details: details,
      event_date: event_date,
      start_time: start_time,
      end_time: end_time,
      location: location,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('events', eventData);
    
    if (results.errors.length > 0) {
      console.error('Events Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Events Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create event in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdEvent = successResult.rows[0] || successResult.rows[0];
    
    console.log('Events Create - Success:', createdEvent);
    res.json({ 
      status: 'success', 
      event: createdEvent,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create event: ' + err.message });
  }
});

// Events UPDATE endpoint
app.put('/api/admin/events/:id/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Events Update - Request body:', req.body);
    const { id } = req.params;
    const { title, description, details, event_date, start_time, end_time, location, is_active, display_order } = req.body;
    
    if (!title || !event_date) {
      console.log('Events Update - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title and event date are required' });
    }
    
    console.log('Events Update - Updating data in both databases:', { id, title, description, details, event_date, start_time, end_time, location, is_active, display_order });
    
    const updateData = {
      title: title,
      description: description,
      details: details,
      event_date: event_date,
      start_time: start_time,
      end_time: end_time,
      location: location,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await updateBothDatabases('events', updateData, 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Events Update - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Events Update - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to update event in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const updatedEvent = successResult.rows[0] || successResult.rows[0];
    
    console.log('Events Update - Success:', updatedEvent);
    res.json({ 
      status: 'success', 
      event: updatedEvent,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('Event update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update event: ' + err.message });
  }
});

// Events DELETE endpoint
app.delete('/api/admin/events/:id/', requireAdmin, async (req, res) => {
  try {
    console.log('Events Delete - ID:', req.params.id);
    const { id } = req.params;
    
    console.log('Events Delete - Deleting from both databases:', { id });
    
    const results = await deleteFromBothDatabases('events', 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Events Delete - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Events Delete - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to delete event in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const deletedEvent = successResult.rows[0] || successResult.rows[0];
    
    if (!deletedEvent) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }
    
    console.log('Events Delete - Success:', deletedEvent);
    res.json({ 
      status: 'success', 
      message: 'Event deleted successfully',
      deleted_event: deletedEvent,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('Event deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete event: ' + err.message });
  }
});

// News endpoints
app.get('/api/admin/news/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', news: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch news' });
  }
});

app.post('/api/admin/news/create/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('News Create - Request body:', req.body);
    const { title, body, details, date, is_active, display_order } = req.body;
    
    if (!title || !body || !date) {
      console.log('News Create - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title, body, and date are required' });
    }
    
    console.log('News Create - Inserting data into both databases:', { title, body, details, date, is_active, display_order });
    
    const newsData = {
      title: title,
      body: body,
      details: details,
      date: date,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('news', newsData);
    
    if (results.errors.length > 0) {
      console.error('News Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('News Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create news in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdNews = successResult.rows[0] || successResult.rows[0];
    
    console.log('News Create - Success:', createdNews);
    res.json({ 
      status: 'success', 
      news: createdNews,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('News creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create news: ' + err.message });
  }
});

// News UPDATE endpoint
app.put('/api/admin/news/:id/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('News Update - Request body:', req.body);
    const { id } = req.params;
    const { title, body, details, date, is_active, display_order } = req.body;
    
    if (!title || !body || !date) {
      console.log('News Update - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title, body, and date are required' });
    }
    
    console.log('News Update - Updating data in both databases:', { id, title, body, details, date, is_active, display_order });
    
    const updateData = {
      title: title,
      body: body,
      details: details,
      date: date,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await updateBothDatabases('news', updateData, 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('News Update - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('News Update - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to update news in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const updatedNews = successResult.rows[0] || successResult.rows[0];
    
    console.log('News Update - Success:', updatedNews);
    res.json({ 
      status: 'success', 
      news: updatedNews,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('News update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update news: ' + err.message });
  }
});

// News DELETE endpoint
app.delete('/api/admin/news/:id/', requireAdmin, async (req, res) => {
  try {
    console.log('News Delete - ID:', req.params.id);
    const { id } = req.params;
    
    console.log('News Delete - Deleting from both databases:', { id });
    
    const results = await deleteFromBothDatabases('news', 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('News Delete - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('News Delete - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to delete news in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const deletedNews = successResult.rows[0] || successResult.rows[0];
    
    if (!deletedNews) {
      return res.status(404).json({ status: 'error', message: 'News not found' });
    }
    
    console.log('News Delete - Success:', deletedNews);
    res.json({ 
      status: 'success', 
      message: 'News deleted successfully',
      deleted_news: deletedNews,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('News deletion error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete news: ' + err.message });
  }
});

// Announcements endpoints
app.get('/api/admin/announcements/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', announcements: result.rows });
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
    
    console.log('Announcements Create - Inserting data into both databases:', { title, date, body, details, is_active, display_order });
    
    const announcementData = {
      title: title,
      date: date,
      body: body,
      details: details,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('announcements', announcementData);
    
    if (results.errors.length > 0) {
      console.error('Announcements Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Announcements Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create announcement in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdAnnouncement = successResult.rows[0] || successResult.rows[0];
    
    console.log('Announcements Create - Success:', createdAnnouncement);
    res.json({ 
      status: 'success', 
      announcement: createdAnnouncement,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    const { title, date, body, details, is_active, display_order } = req.body;
    
    if (!title || !date || !body) {
      console.log('Announcements Update - Missing required fields');
      return res.status(400).json({ status: 'error', message: 'Title, date, and body are required' });
    }
    
    console.log('Announcements Update - Updating data in both databases:', { id, title, date, body, details, is_active, display_order });
    
    const updateData = {
      title: title,
      date: date,
      body: body,
      details: details,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await updateBothDatabases('announcements', updateData, 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Announcements Update - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Announcements Update - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to update announcement in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const updatedAnnouncement = successResult.rows[0] || successResult.rows[0];
    
    console.log('Announcements Update - Success:', updatedAnnouncement);
    res.json({ 
      status: 'success', 
      announcement: updatedAnnouncement,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Announcements Delete - Deleting from both databases:', { id });
    
    const results = await deleteFromBothDatabases('announcements', 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Announcements Delete - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Announcements Delete - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to delete announcement in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const deletedAnnouncement = successResult.rows[0] || successResult.rows[0];
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ status: 'error', message: 'Announcement not found' });
    }
    
    console.log('Announcements Delete - Success:', deletedAnnouncement);
    res.json({ 
      status: 'success', 
      message: 'Announcement deleted successfully',
      deleted_announcement: deletedAnnouncement,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    res.json({ status: 'success', achievements: result.rows });
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
    
    console.log('Achievements Create - Inserting data into both databases:', { title, description, details, achievement_date, category, is_active, display_order });
    
    const achievementData = {
      title: title,
      description: description,
      details: details,
      achievement_date: achievement_date,
      category: category,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('achievements', achievementData);
    
    if (results.errors.length > 0) {
      console.error('Achievements Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Achievements Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create achievement in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdAchievement = successResult.rows[0] || successResult.rows[0];
    
    console.log('Achievements Create - Success:', createdAchievement);
    res.json({ 
      status: 'success', 
      achievement: createdAchievement,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
    });
  } catch (err) {
    console.error('Achievement creation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create achievement: ' + err.message });
  }
});

// Academic Programs endpoints
app.get('/api/admin/academic-programs/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM academic_programs ORDER BY display_order, created_at DESC');
    res.json({ status: 'success', programs: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch academic programs' });
  }
});

app.post('/api/admin/academic-programs/create/', requireAdmin, async (req, res) => {
  try {
    console.log('Academic Programs Create - Request body:', req.body);
    const { title, short_title, program_type, description, duration_years, total_units, with_enhancements, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Academic Programs Create - Missing title');
      return res.status(400).json({ status: 'error', message: 'Program title is required' });
    }
    
    console.log('Academic Programs Create - Inserting data into both databases:', { title, short_title, program_type, description, duration_years, total_units, with_enhancements, is_active, display_order });
    
    const programData = {
      name: title,
      description: description,
      degree_type: program_type || 'BS',
      duration_years: parseInt(duration_years) || 4,
      total_units: parseInt(total_units) || 120,
      with_enhancements: parseInt(with_enhancements) || 0,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('academic_programs', programData);
    
    if (results.errors.length > 0) {
      console.error('Academic Programs Create - Database errors:', results.errors);
      // Still return success if at least one database worked
      if (results.postgresql || results.mysql) {
        console.log('Academic Programs Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create academic program in both databases', errors: results.errors });
      }
    }
    
    // Return the PostgreSQL result (primary), or MySQL if PostgreSQL failed
    const successResult = results.postgresql || results.mysql;
    const createdProgram = successResult.rows[0] || successResult.rows[0];
    
    console.log('Academic Programs Create - Success:', createdProgram);
    res.json({ 
      status: 'success', 
      program: createdProgram,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    const { title, short_title, program_type, description, duration_years, total_units, with_enhancements, is_active, display_order } = req.body;
    
    if (!title) {
      console.log('Academic Programs Update - Missing title');
      return res.status(400).json({ status: 'error', message: 'Program title is required' });
    }
    
    console.log('Academic Programs Update - Updating data in both databases:', { id, title, short_title, program_type, description, duration_years, total_units, with_enhancements, is_active, display_order });
    
    const updateData = {
      name: title,
      description: description,
      degree_type: program_type || 'BS',
      duration_years: parseInt(duration_years) || 4,
      total_units: parseInt(total_units) || 120,
      with_enhancements: parseInt(with_enhancements) || 0,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await updateBothDatabases('academic_programs', updateData, 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Academic Programs Update - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Academic Programs Update - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to update academic program in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const updatedProgram = successResult.rows[0] || successResult.rows[0];
    
    console.log('Academic Programs Update - Success:', updatedProgram);
    res.json({ 
      status: 'success', 
      program: updatedProgram,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Academic Programs Delete - Deleting from both databases:', { id });
    
    const results = await deleteFromBothDatabases('academic_programs', 'id = $1', [parseInt(id)]);
    
    if (results.errors.length > 0) {
      console.error('Academic Programs Delete - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Academic Programs Delete - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to delete academic program in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const deletedProgram = successResult.rows[0] || successResult.rows[0];
    
    if (!deletedProgram) {
      return res.status(404).json({ status: 'error', message: 'Academic program not found' });
    }
    
    console.log('Academic Programs Delete - Success:', deletedProgram);
    res.json({ 
      status: 'success', 
      message: 'Academic program deleted successfully',
      deleted_program: deletedProgram,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Departments Create - Inserting data into both databases:', { name, department_type, description, office_location, phone, email, head_name, head_title, is_active, display_order });
    
    const departmentData = {
      name: name,
      department_type: department_type || 'academic',
      description: description,
      office_location: office_location,
      phone: phone,
      email: email,
      head_name: head_name,
      head_title: head_title,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('departments', departmentData);
    
    if (results.errors.length > 0) {
      console.error('Departments Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Departments Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create department in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdDepartment = successResult.rows[0] || successResult.rows[0];
    
    console.log('Departments Create - Success:', createdDepartment);
    res.json({ 
      status: 'success', 
      department: createdDepartment,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Personnel Create - Inserting data into both databases:', { full_name, title, department_id, email, phone, bio, is_active, display_order });
    
    const personnelData = {
      full_name: full_name,
      title: title,
      department_id: department_id ? parseInt(department_id) : null,
      email: email,
      phone: phone,
      bio: bio,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('personnel', personnelData);
    
    if (results.errors.length > 0) {
      console.error('Personnel Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Personnel Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create personnel in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdPersonnel = successResult.rows[0] || successResult.rows[0];
    
    console.log('Personnel Create - Success:', createdPersonnel);
    res.json({ 
      status: 'success', 
      personnel: createdPersonnel,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Admission Requirements Create - Inserting data into both databases:', { category, requirement_text, is_active, display_order });
    
    const requirementData = {
      category: category || 'new-scholar',
      requirement_text: requirement_text,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('admission_requirements', requirementData);
    
    if (results.errors.length > 0) {
      console.error('Admission Requirements Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Admission Requirements Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create admission requirement in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdRequirement = successResult.rows[0] || successResult.rows[0];
    
    console.log('Admission Requirements Create - Success:', createdRequirement);
    res.json({ 
      status: 'success', 
      requirement: createdRequirement,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Enrollment Steps Create - Inserting data into both databases:', { category, step_number, title, description, is_active, display_order });
    
    const stepData = {
      category: category || 'new-scholar',
      step_number: parseInt(step_number) || 1,
      title: title,
      description: description,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('enrollment_steps', stepData);
    
    if (results.errors.length > 0) {
      console.error('Enrollment Steps Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Enrollment Steps Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create enrollment step in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdStep = successResult.rows[0] || successResult.rows[0];
    
    console.log('Enrollment Steps Create - Success:', createdStep);
    res.json({ 
      status: 'success', 
      step: createdStep,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    
    console.log('Admission Notes Create - Inserting data into both databases:', { title, note_text, is_active, display_order });
    
    const noteData = {
      title: title,
      note_text: note_text,
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('admission_notes', noteData);
    
    if (results.errors.length > 0) {
      console.error('Admission Notes Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Admission Notes Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create admission note in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdNote = successResult.rows[0] || successResult.rows[0];
    
    console.log('Admission Notes Create - Success:', createdNote);
    res.json({ 
      status: 'success', 
      note: createdNote,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
        [vision, mission, goals, core_values, is_active, existing.rows[0].id]
      );
      res.json({ status: 'success', institutional_info: result.rows[0] });
    } else {
      // Create new record
      const result = await pool.query(
        `INSERT INTO institutional_info (vision, mission, goals, core_values, is_active) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [vision, mission, goals, core_values, is_active]
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
    
    console.log('Downloads Create - Inserting data into both databases:', { title, description, category, is_active, display_order });
    
    const downloadData = {
      title: title,
      description: description,
      category: category || 'other',
      is_active: is_active === 'true',
      display_order: parseInt(display_order) || 0
    };
    
    const results = await insertIntoBothDatabases('downloads', downloadData);
    
    if (results.errors.length > 0) {
      console.error('Downloads Create - Database errors:', results.errors);
      if (results.postgresql || results.mysql) {
        console.log('Downloads Create - Partial success');
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to create download in both databases', errors: results.errors });
      }
    }
    
    const successResult = results.postgresql || results.mysql;
    const createdDownload = successResult.rows[0] || successResult.rows[0];
    
    console.log('Downloads Create - Success:', createdDownload);
    res.json({ 
      status: 'success', 
      download: createdDownload,
      sync_status: {
        postgresql: !!results.postgresql,
        mysql: !!results.mysql,
        errors: results.errors
      }
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
    await pool.query(
      `INSERT INTO contacts (name, email, phone, subject, message, verification_token) VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, phone, subject, message, token]
    );

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
      res.json({ status: 'success', message: 'Verification email sent.' });
    } catch (emailErr) {
      console.error('Brevo email error:', emailErr);
      // Optional: Delete the record if email fails? For now we keep it.
      res.status(500).json({ status: 'error', message: 'Failed to send verification email.' });
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
    } catch (adminErr) {
      console.error('Admin notification error:', adminErr);
      res.send('Verified, but failed to notify admin. We will check the database.');
    }

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('An error occurred during verification.');
  }
});

// 3. Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', db: dbReady ? 'ready' : 'not_ready' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
