const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SystemSetting {
  static create(data) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO SystemSetting (id, key, value, category, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.key, data.value, data.category, now);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM SystemSetting WHERE id = ?');
    return stmt.get(id);
  }

  static findByKey(key) {
    const stmt = db.prepare('SELECT * FROM SystemSetting WHERE key = ?');
    return stmt.get(key);
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM SystemSetting ORDER BY category, key');
    return stmt.all();
  }

  static findByCategory(category) {
    const stmt = db.prepare('SELECT * FROM SystemSetting WHERE category = ? ORDER BY key');
    return stmt.all(category);
  }

  static update(key, value) {
    const stmt = db.prepare(`
      UPDATE SystemSetting SET value = ?, updatedAt = ? WHERE key = ?
    `);

    const now = Date.now();
    stmt.run(value, now, key);
    return this.findByKey(key);
  }

  static upsert(key, value, category) {
    const existing = this.findByKey(key);

    if (existing) {
      return this.update(key, value);
    } else {
      return this.create({ key, value, category });
    }
  }

  static delete(key) {
    const stmt = db.prepare('DELETE FROM SystemSetting WHERE key = ?');
    return stmt.run(key);
  }

  static getAllAsObject() {
    const settings = this.findAll();
    const result = {};

    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }
}

module.exports = SystemSetting;
