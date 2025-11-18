const Challenge = require('../models/Challenge');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const { UserAchievement } = require('../models/Achievement');

// Get all challenges (with optional user progress)
exports.getAllChallenges = async (req, res) => {
  try {
    let challenges;

    if (req.user) {
      // Authenticated user - include progress
      challenges = Challenge.findAllWithProgress(req.user.id);
    } else {
      // Guest user - just challenges
      challenges = Challenge.findAll();
    }

    // Don't expose solutions to non-admins
    challenges = challenges.map(c => {
      const challenge = { ...c };
      if (!req.user || req.user.role === 'USER') {
        delete challenge.solution;
      }
      return challenge;
    });

    res.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
};

// Get single challenge
exports.getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = Challenge.findById(id) || Challenge.findByLevelNumber(parseInt(id));

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get user progress if authenticated
    let progress = null;
    if (req.user) {
      progress = UserProgress.findByUserAndChallenge(req.user.id, challenge.id);
    }

    // Don't expose solution to non-admins
    const response = { ...challenge, progress };
    if (!req.user || req.user.role === 'USER') {
      delete response.solution;
    }

    res.json({ challenge: response });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Failed to get challenge' });
  }
};

// Submit code for challenge
exports.submitCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, output } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const challenge = Challenge.findById(id) || Challenge.findByLevelNumber(parseInt(id));

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Validate output against expected output
    const isCorrect = validateOutput(output, challenge);

    // Get or create progress
    let progress = UserProgress.findByUserAndChallenge(req.user.id, challenge.id);
    const isFirstCompletion = !progress || progress.status !== 'completed';
    const startTime = progress ? progress.createdAt : Date.now();

    const updateData = {
      attempts: (progress?.attempts || 0) + 1,
      lastCode: code,
      status: isCorrect ? 'completed' : 'in_progress'
    };

    if (isCorrect && isFirstCompletion) {
      updateData.completedAt = Date.now();
      updateData.timeSpent = Math.floor((Date.now() - startTime) / 1000);
    }

    progress = UserProgress.upsert(req.user.id, challenge.id, updateData);

    // Award points if first completion
    if (isCorrect && isFirstCompletion) {
      const user = User.findById(req.user.id);
      User.update(req.user.id, {
        totalPoints: user.totalPoints + challenge.points
      });

      // Check for achievements (async, don't wait)
      checkAndAwardAchievements(req.user.id).catch(err =>
        console.error('Achievement check error:', err)
      );
    }

    res.json({
      success: isCorrect,
      message: isCorrect ? 'Correct! Challenge completed!' : 'Not quite right. Try again!',
      progress: {
        status: progress.status,
        attempts: progress.attempts,
        completedAt: progress.completedAt
      },
      pointsEarned: (isCorrect && isFirstCompletion) ? challenge.points : 0
    });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
};

// Get user progress
exports.getProgress = async (req, res) => {
  try {
    const progress = UserProgress.findByUser(req.user.id);
    const stats = UserProgress.getUserStats(req.user.id);

    res.json({
      progress,
      stats: {
        totalChallenges: stats.totalChallenges,
        completed: stats.completed,
        inProgress: stats.inProgress,
        totalAttempts: stats.totalAttempts,
        totalTimeSpent: stats.totalTimeSpent
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};

// Reset challenge progress
exports.resetProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = Challenge.findById(id) || Challenge.findByLevelNumber(parseInt(id));

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    UserProgress.deleteByUserAndChallenge(req.user.id, challenge.id);

    res.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
};

// Helper: Validate output
function validateOutput(output, challenge) {
  if (!output) return false;

  const trimmedOutput = output.trim();
  const expectedOutput = challenge.expectedOutput.trim();

  switch (challenge.testType) {
    case 'exact':
      return trimmedOutput === expectedOutput;

    case 'flexible':
      // For string variables challenge - check if starts with "Hello, " and ends with "!"
      return trimmedOutput.startsWith('Hello, ') && trimmedOutput.endsWith('!');

    case 'flexible-color':
      // For user input challenge - check if starts with "Your favorite color is "
      return trimmedOutput.startsWith('Your favorite color is ');

    case 'pattern':
      // For functions with parameters and dictionaries
      // Accept any reasonable output for these challenges
      return trimmedOutput.length > 0;

    default:
      return trimmedOutput === expectedOutput;
  }
}

// Helper: Check and award achievements
async function checkAndAwardAchievements(userId) {
  const { Achievement, UserAchievement } = require('../models/Achievement');

  const stats = UserProgress.getUserStats(userId);
  const user = User.findById(userId);
  const achievements = Achievement.findAll();

  for (const achievement of achievements) {
    const condition = achievement.condition;
    let shouldAward = false;

    switch (condition.type) {
      case 'challenges_completed':
        shouldAward = stats.completed >= condition.count;
        break;

      case 'streak':
        shouldAward = user.currentStreak >= condition.days;
        break;

      // Add more conditions as needed
      default:
        break;
    }

    if (shouldAward && !UserAchievement.hasAchievement(userId, achievement.id)) {
      UserAchievement.award(userId, achievement.id);

      // Award achievement points to user
      User.update(userId, {
        totalPoints: user.totalPoints + achievement.points
      });
    }
  }
}

module.exports = exports;
