const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');

// Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const result = User.findAll({ page: parseInt(page), limit: parseInt(limit), ...filters });

    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get user details
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = User.getStats(id);

    res.json({ user: { ...user, password: undefined }, stats });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, role, isActive } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;

    const user = User.update(id, updates);

    // Log action
    AuditLog.log('update', 'user', { id, updates }, req);

    res.json({ message: 'User updated successfully', user: { ...user, password: undefined } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deletion of last super admin
    if (req.user.role === 'SUPER_ADMIN') {
      const superAdmins = User.findAll({ role: 'SUPER_ADMIN', limit: 100 });
      if (superAdmins.users.length <= 1 && superAdmins.users[0]?.id === id) {
        return res.status(400).json({ error: 'Cannot delete the last super admin' });
      }
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    User.delete(id);

    // Log action
    AuditLog.log('delete', 'user', { id }, req);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Toggle user status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = User.update(id, { isActive: user.isActive ? 0 : 1 });

    // Log action
    AuditLog.log('toggle_status', 'user', { id, newStatus: updatedUser.isActive }, req);

    res.json({ message: 'User status updated', user: { ...updatedUser, password: undefined } });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const bcrypt = require('bcrypt');
    const crypto = require('crypto');

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    User.update(id, { password: hashedPassword });

    // Log action
    AuditLog.log('reset_password', 'user', { id }, req);

    // In production, send email with temp password
    res.json({
      message: 'Password reset successfully',
      temporaryPassword: tempPassword // Only for development
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = exports;
