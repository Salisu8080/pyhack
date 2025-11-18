const Challenge = require('../../models/Challenge');
const AuditLog = require('../../models/AuditLog');

// Create challenge
exports.createChallenge = async (req, res) => {
  try {
    const challengeData = req.body;
    const challenge = Challenge.create(challengeData);

    // Log action
    AuditLog.log('create', 'challenge', { id: challenge.id }, req);

    res.status(201).json({ message: 'Challenge created successfully', challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

// Update challenge
exports.updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const challenge = Challenge.update(id, updates);

    // Log action
    AuditLog.log('update', 'challenge', { id, updates }, req);

    res.json({ message: 'Challenge updated successfully', challenge });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
};

// Delete challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    Challenge.delete(id);

    // Log action
    AuditLog.log('delete', 'challenge', { id }, req);

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
};

// Toggle challenge status
exports.toggleChallengeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updated = Challenge.update(id, { isActive: challenge.isActive ? 0 : 1 });

    // Log action
    AuditLog.log('toggle_status', 'challenge', { id, newStatus: updated.isActive }, req);

    res.json({ message: 'Challenge status updated', challenge: updated });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to toggle challenge status' });
  }
};

// Reorder challenges
exports.reorderChallenges = async (req, res) => {
  try {
    const { newOrder } = req.body; // Array of { id, levelNumber }

    Challenge.reorder(newOrder);

    // Log action
    AuditLog.log('reorder', 'challenge', { newOrder }, req);

    res.json({ message: 'Challenges reordered successfully' });
  } catch (error) {
    console.error('Reorder challenges error:', error);
    res.status(500).json({ error: 'Failed to reorder challenges' });
  }
};

// Get challenge statistics
exports.getChallengeStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = Challenge.getStats(id);

    res.json({ stats });
  } catch (error) {
    console.error('Get challenge stats error:', error);
    res.status(500).json({ error: 'Failed to get challenge statistics' });
  }
};

// Get all challenges (admin view - includes inactive)
exports.getAllChallenges = async (req, res) => {
  try {
    const challenges = Challenge.findAll({ includeInactive: true });

    res.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
};

module.exports = exports;
