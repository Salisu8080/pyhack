const SystemSetting = require('../../models/SystemSetting');
const AuditLog = require('../../models/AuditLog');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = SystemSetting.findAll();

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({ settings: grouped });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update setting
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = SystemSetting.update(key, value);

    // Log action
    AuditLog.log('update', 'setting', { key, value }, req);

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity, userId, startDate, endDate } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (action) filters.action = action;
    if (entity) filters.entity = entity;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = parseInt(startDate);
    if (endDate) filters.endDate = parseInt(endDate);

    const result = AuditLog.findAll(filters);

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

module.exports = exports;
