const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Session {
  static create(data) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO Session (
        id, userId, token, userAgent, ipAddress, expiresAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.userId,
      data.token,
      data.userAgent || null,
      data.ipAddress || null,
      data.expiresAt,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM Session WHERE id = ?');
    return stmt.get(id);
  }

  static findByToken(token) {
    const stmt = db.prepare('SELECT * FROM Session WHERE token = ?');
    return stmt.get(token);
  }

  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT * FROM Session
      WHERE userId = ?
      ORDER BY createdAt DESC
    `);
    return stmt.all(userId);
  }

  static deleteByToken(token) {
    const stmt = db.prepare('DELETE FROM Session WHERE token = ?');
    return stmt.run(token);
  }

  static deleteByUser(userId) {
    const stmt = db.prepare('DELETE FROM Session WHERE userId = ?');
    return stmt.run(userId);
  }

  static deleteExpired() {
    const now = Date.now();
    const stmt = db.prepare('DELETE FROM Session WHERE expiresAt < ?');
    return stmt.run(now);
  }

  static isValid(token) {
    const session = this.findByToken(token);
    if (!session) return false;
    return session.expiresAt > Date.now();
  }
}

module.exports = Session;
