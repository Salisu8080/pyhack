const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuditLog {
  static create(data) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO AuditLog (
        id, userId, action, entity, entityId, details, ipAddress, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.userId || null,
      data.action,
      data.entity,
      data.entityId || null,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress || null,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM AuditLog WHERE id = ?');
    const log = stmt.get(id);
    if (log && log.details) {
      log.details = JSON.parse(log.details);
    }
    return log;
  }

  static findAll({ page = 1, limit = 50, action, entity, userId, startDate, endDate } = {}) {
    let query = 'SELECT * FROM AuditLog WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (entity) {
      query += ' AND entity = ?';
      params.push(entity);
    }

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND createdAt >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND createdAt <= ?';
      params.push(endDate);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count } = db.prepare(countQuery).get(...params);

    // Add pagination
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const stmt = db.prepare(query);
    const logs = stmt.all(...params).map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    return {
      logs,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  static log(action, entity, data, req) {
    return this.create({
      userId: req.user?.id,
      action,
      entity,
      entityId: data.id,
      details: data,
      ipAddress: req.ip || req.connection?.remoteAddress
    });
  }
}

module.exports = AuditLog;
