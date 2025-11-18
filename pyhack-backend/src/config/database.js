const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../dev.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
      isActive INTEGER DEFAULT 1,
      emailVerified INTEGER DEFAULT 0,
      verificationToken TEXT,
      resetToken TEXT,
      resetTokenExpiry INTEGER,
      lastLogin INTEGER,
      totalPoints INTEGER DEFAULT 0,
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Challenges table
    CREATE TABLE IF NOT EXISTS Challenge (
      id TEXT PRIMARY KEY,
      levelNumber INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      task TEXT NOT NULL,
      starterCode TEXT NOT NULL,
      expectedOutput TEXT NOT NULL,
      hint TEXT,
      solution TEXT NOT NULL,
      testType TEXT DEFAULT 'exact',
      difficulty TEXT DEFAULT 'beginner',
      points INTEGER DEFAULT 10,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- User Progress table
    CREATE TABLE IF NOT EXISTS UserProgress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      challengeId TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      attempts INTEGER DEFAULT 0,
      lastCode TEXT,
      completedAt INTEGER,
      timeSpent INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (challengeId) REFERENCES Challenge(id) ON DELETE CASCADE,
      UNIQUE(userId, challengeId)
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS Session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      userAgent TEXT,
      ipAddress TEXT,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );

    -- Achievements table
    CREATE TABLE IF NOT EXISTS Achievement (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      points INTEGER NOT NULL,
      condition TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- User Achievements table
    CREATE TABLE IF NOT EXISTS UserAchievement (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      achievementId TEXT NOT NULL,
      unlockedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (achievementId) REFERENCES Achievement(id) ON DELETE CASCADE,
      UNIQUE(userId, achievementId)
    );

    -- Audit Logs table
    CREATE TABLE IF NOT EXISTS AuditLog (
      id TEXT PRIMARY KEY,
      userId TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entityId TEXT,
      details TEXT,
      ipAddress TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- System Settings table
    CREATE TABLE IF NOT EXISTS SystemSetting (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_user_progress_userId ON UserProgress(userId);
    CREATE INDEX IF NOT EXISTS idx_user_progress_challengeId ON UserProgress(challengeId);
    CREATE INDEX IF NOT EXISTS idx_session_userId ON Session(userId);
    CREATE INDEX IF NOT EXISTS idx_session_token ON Session(token);
    CREATE INDEX IF NOT EXISTS idx_user_achievement_userId ON UserAchievement(userId);
    CREATE INDEX IF NOT EXISTS idx_audit_log_userId ON AuditLog(userId);
    CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON AuditLog(entity);
    CREATE INDEX IF NOT EXISTS idx_audit_log_createdAt ON AuditLog(createdAt);
  `;

  try {
    db.exec(schema);
    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  }
}

// Test database connection
async function connectDatabase() {
  try {
    initializeDatabase();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
function disconnectDatabase() {
  db.close();
  console.log('Database disconnected');
}

process.on('beforeExit', () => {
  disconnectDatabase();
});

module.exports = { db, connectDatabase, disconnectDatabase };
