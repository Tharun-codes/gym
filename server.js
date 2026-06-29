const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup & Resilient Fallback (Mock Mode)
let dbPool = null;
let useMockDb = false;
const MOCK_DB_FILE = path.join(__dirname, 'leads_mock.json');

// Helper to check if Database URL is the default placeholder or empty
const isPlaceholderDbUrl = (url) => {
  return !url || url.includes('username:password') || url.includes('ep-something');
};

const dbUrl = process.env.DATABASE_URL;

if (isPlaceholderDbUrl(dbUrl)) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  WARNING: DATABASE_URL is not configured or is the default placeholder.');
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  Backend is running in MOCK DATABASE mode. Submissions will be saved to: leads_mock.json');
  useMockDb = true;
} else {
  try {
    dbPool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false // Required for secure connection to Neon PostgreSQL
      }
    });

    // Test database connection and initialize table if needed
    dbPool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Database Connection Error:', err.message);
        console.warn('\x1b[33m%s\x1b[0m', '⚠️  Falling back to MOCK DATABASE mode (leads_mock.json)');
        useMockDb = true;
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ Neon PostgreSQL Connected Successfully.');
        initializeDatabaseTable();
      }
    });
  } catch (error) {
    console.error('❌ Failed to initialize Pool:', error.message);
    useMockDb = true;
  }
}

// Function to auto-create 'leads' table in PostgreSQL if it doesn't exist
async function initializeDatabaseTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      plan_selected VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await dbPool.query(createTableQuery);
    console.log('\x1b[32m%s\x1b[0m', '✅ "leads" table verified/created in database.');
  } catch (err) {
    console.error('❌ Error creating "leads" table:', err.message);
  }
}

// Read mock leads from file
function readMockLeads() {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const data = fs.readFileSync(MOCK_DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading mock database:', e);
  }
  return [];
}

// Write mock lead to file
function saveMockLead(lead) {
  try {
    const leads = readMockLeads();
    leads.push(lead);
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(leads, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving mock lead:', e);
    return false;
  }
}

// API Endpoint to Book a Free Trial (Lead Capture)
app.post('/api/book-trial', async (req, res) => {
  const { name, phone, plan_selected } = req.body;

  // 1. Validation
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }
  if (!phone || typeof phone !== 'string' || !/^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())) {
    errors.push('Please enter a valid phone number (7 to 20 digits, space, hyphen, parentheses allowed).');
  }
  if (!plan_selected || typeof plan_selected !== 'string') {
    errors.push('Please select a valid membership plan.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  const sanitizedName = name.trim();
  const sanitizedPhone = phone.trim();
  const sanitizedPlan = plan_selected.trim();

  // 2. Database Insertion
  if (useMockDb) {
    // Save to local JSON file (Mock database)
    const mockId = require('crypto').randomUUID();
    const newLead = {
      id: mockId,
      name: sanitizedName,
      phone: sanitizedPhone,
      plan_selected: sanitizedPlan,
      created_at: new Date().toISOString()
    };

    if (saveMockLead(newLead)) {
      return res.status(201).json({
        success: true,
        message: 'Trial booked successfully! (Saved to Mock DB)',
        dbMode: 'mock',
        lead: { id: mockId, name: sanitizedName }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Internal server error saving lead data.'
      });
    }
  } else {
    // Insert into PostgreSQL using pg Pool
    const insertQuery = `
      INSERT INTO leads (name, phone, plan_selected)
      VALUES ($1, $2, $3)
      RETURNING id, name, created_at;
    `;
    try {
      const result = await dbPool.query(insertQuery, [sanitizedName, sanitizedPhone, sanitizedPlan]);
      const createdLead = result.rows[0];
      return res.status(201).json({
        success: true,
        message: 'Trial booked successfully! (Saved to Neon DB)',
        dbMode: 'neon',
        lead: createdLead
      });
    } catch (err) {
      console.error('❌ Error executing database insert:', err.message);
      return res.status(500).json({
        success: false,
        message: 'A database error occurred while saving your details. Please try again later.'
      });
    }
  }
});

// Fallback to serve index.html for undefined routes (for single page routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 FlexForge Fitness server running at: http://localhost:${PORT}`);
  console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
