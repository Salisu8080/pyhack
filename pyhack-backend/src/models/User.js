const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  static create(userData) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO User (
        id, email, username, password, firstName, lastName,
        role, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userData.email,
      userData.username,
      userData.password,
      userData.firstName || null,
      userData.lastName || null,
      userData.role || 'USER',
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM User WHERE id = ?');
    return stmt.get(id);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM User WHERE email = ?');
    return stmt.get(email);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM User WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmailOrUsername(identifier) {
    const stmt = db.prepare('SELECT * FROM User WHERE email = ? OR username = ?');
    return stmt.get(identifier, identifier);
  }

  static findByVerificationToken(token) {
    const stmt = db.prepare('SELECT * FROM User WHERE verificationToken = ?');
    return stmt.get(token);
  }

  static findByResetToken(token) {
    const stmt = db.prepare(`
      SELECT * FROM User
      WHERE resetToken = ? AND resetTokenExpiry > ?
    `);
    return stmt.get(token, Date.now());
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'email', 'username', 'password', 'firstName', 'lastName',
      'avatar', 'role', 'isActive', 'emailVerified', 'verificationToken',
      'resetToken', 'resetTokenExpiry', 'lastLogin', 'totalPoints',
      'currentStreak', 'longestStreak'
    ];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updatedAt = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE User SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM User WHERE id = ?');
    return stmt.run(id);
  }

  static findAll({ page = 1, limit = 20, role, isActive, search } = {}) {
    let query = 'SELECT * FROM User WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(isActive ? 1 : 0);
    }

    if (search) {
      query += ' AND (email LIKE ? OR username LIKE ? OR firstName LIKE ? OR lastName LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = db.prepare(countQuery).get(...params);

    // Add pagination
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const stmt = db.prepare(query);
    const users = stmt.all(...params);

    return {
      users,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  static getStats(userId) {
    const user = this.findById(userId);
    if (!user) return null;

    const progressStmt = db.prepare(`
      SELECT
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedChallenges,
        SUM(timeSpent) as totalTimeSpent
      FROM UserProgress
      WHERE userId = ?
    `);

    const progress = progressStmt.get(userId);

    return {
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      completedChallenges: progress.completedChallenges || 0,
      totalAttempts: progress.totalAttempts || 0,
      totalTimeSpent: progress.totalTimeSpent || 0
    };
  }
}

module.exports = User;
