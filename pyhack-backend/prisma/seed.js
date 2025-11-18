const { db, connectDatabase } = require('../src/config/database');
const Challenge = require('../src/models/Challenge');
const SystemSetting = require('../src/models/SystemSetting');
const { Achievement } = require('../src/models/Achievement');

async function seedChallenges() {
  console.log('Seeding challenges...');

  const challenges = [
    {
      levelNumber: 1,
      title: 'Hello World',
      description: 'Welcome to Python! Let\'s start with the classic first program.',
      task: 'Write a program that prints "Hello, World!"',
      starterCode: '# Write your code here\n',
      expectedOutput: 'Hello, World!',
      hint: 'Use the print() function to display text',
      solution: "print('Hello, World!')",
      testType: 'exact',
      difficulty: 'beginner',
      points: 10
    },
    {
      levelNumber: 2,
      title: 'Variables & Numbers',
      description: 'Learn how to store and use numbers in variables.',
      task: 'Create a variable named "age" with value 25 and print it',
      starterCode: '# Create a variable and print it\n',
      expectedOutput: '25',
      hint: 'Assign 25 to a variable named age, then print it',
      solution: 'age = 25\nprint(age)',
      testType: 'exact',
      difficulty: 'beginner',
      points: 10
    },
    {
      levelNumber: 3,
      title: 'String Variables',
      description: 'Learn how to work with text (strings) in Python.',
      task: 'Create a string variable with any name and print "Hello, [name]!"',
      starterCode: '# Create a string and print a greeting\n',
      expectedOutput: 'Hello, World!',
      hint: 'Use a variable to store a name, then use f-string to create the greeting',
      solution: "name = 'Python'\nprint(f'Hello, {name}!')",
      testType: 'flexible',
      difficulty: 'beginner',
      points: 10
    },
    {
      levelNumber: 4,
      title: 'User Input',
      description: 'Learn how to get input from users.',
      task: 'Ask for a favorite color and print "Your favorite color is [color]"',
      starterCode: '# Get user input and display it\n',
      expectedOutput: 'Your favorite color is blue',
      hint: 'Use input() to get the color, then print it in the required format',
      solution: "color = input('What is your favorite color? ')\nprint(f'Your favorite color is {color}')",
      testType: 'flexible-color',
      difficulty: 'beginner',
      points: 15
    },
    {
      levelNumber: 5,
      title: 'Basic Math',
      description: 'Python is great at math! Let\'s do some calculations.',
      task: 'Calculate and print the sum of 15 and 27',
      starterCode: '# Calculate the sum\n',
      expectedOutput: '42',
      hint: 'Use the + operator to add the numbers',
      solution: 'print(15 + 27)',
      testType: 'exact',
      difficulty: 'beginner',
      points: 10
    },
    {
      levelNumber: 6,
      title: 'Conditionals',
      description: 'Learn to make decisions in your code with if statements.',
      task: 'Check if 10 is greater than 5 and print "Yes, 10 is greater than 5"',
      starterCode: '# Use an if statement\n',
      expectedOutput: 'Yes, 10 is greater than 5',
      hint: 'Create a variable with value 10, then use if to check if it\'s > 5',
      solution: "number = 10\nif number > 5:\n    print('Yes, 10 is greater than 5')",
      testType: 'exact',
      difficulty: 'beginner',
      points: 15
    },
    {
      levelNumber: 7,
      title: 'For Loops',
      description: 'Learn to repeat actions with for loops.',
      task: 'Use a for loop to print numbers 1, 2, 3 (each on a new line)',
      starterCode: '# Use a for loop\n',
      expectedOutput: '1\n2\n3',
      hint: 'Use range(1, 4) to get numbers 1 through 3',
      solution: 'for i in range(1, 4):\n    print(i)',
      testType: 'exact',
      difficulty: 'intermediate',
      points: 15
    },
    {
      levelNumber: 8,
      title: 'While Loops',
      description: 'Another way to repeat code - the while loop.',
      task: 'Use a while loop to print numbers 1, 2, 3 (each on a new line)',
      starterCode: '# Use a while loop\n',
      expectedOutput: '1\n2\n3',
      hint: 'Start count at 1, loop while count <= 3, increment count each time',
      solution: 'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1',
      testType: 'exact',
      difficulty: 'intermediate',
      points: 15
    },
    {
      levelNumber: 9,
      title: 'Lists Basics',
      description: 'Learn to work with lists - collections of items.',
      task: 'Create a list of fruits and print the second item (index 1)',
      starterCode: '# Create a list and access an item\n',
      expectedOutput: 'banana',
      hint: 'Create a list like [\'apple\', \'banana\', \'orange\'] and use index 1',
      solution: "fruits = ['apple', 'banana', 'orange']\nprint(fruits[1])",
      testType: 'exact',
      difficulty: 'intermediate',
      points: 15
    },
    {
      levelNumber: 10,
      title: 'List Operations',
      description: 'Learn to modify lists by adding items.',
      task: 'Create a list [1, 2, 3], add 4 to it, and print the list',
      starterCode: '# Create a list and add an item\n',
      expectedOutput: '[1, 2, 3, 4]',
      hint: 'Use the append() method to add an item to a list',
      solution: 'numbers = [1, 2, 3]\nnumbers.append(4)\nprint(numbers)',
      testType: 'exact',
      difficulty: 'intermediate',
      points: 20
    },
    {
      levelNumber: 11,
      title: 'Functions Basics',
      description: 'Learn to create reusable code with functions.',
      task: 'Create a function named greet() that prints "Hello!" and call it',
      starterCode: '# Define and call a function\n',
      expectedOutput: 'Hello!',
      hint: 'Use def to define the function, then call it by name',
      solution: "def greet():\n    print('Hello!')\n\ngreet()",
      testType: 'exact',
      difficulty: 'intermediate',
      points: 20
    },
    {
      levelNumber: 12,
      title: 'Functions with Parameters',
      description: 'Make functions more powerful by passing data to them.',
      task: 'Create a function that takes a name parameter and prints "Hello, [name]!"',
      starterCode: '# Define a function with a parameter\n',
      expectedOutput: 'Hello, World!',
      hint: 'Define a function with a parameter, use it in the print statement',
      solution: "def say_hello(name):\n    print(f'Hello, {name}!')\n\nsay_hello('World')",
      testType: 'pattern',
      difficulty: 'intermediate',
      points: 20
    },
    {
      levelNumber: 13,
      title: 'Dictionaries',
      description: 'Learn to store data as key-value pairs.',
      task: 'Create a dictionary with name and age, then print the name',
      starterCode: '# Create a dictionary and access a value\n',
      expectedOutput: 'Alice',
      hint: 'Create a dict like {\'name\': \'Alice\', \'age\': 30} and access \'name\' key',
      solution: "person = {'name': 'Alice', 'age': 30}\nprint(person['name'])",
      testType: 'pattern',
      difficulty: 'advanced',
      points: 25
    },
    {
      levelNumber: 14,
      title: 'String Methods',
      description: 'Discover useful methods for working with strings.',
      task: 'Convert "python programming" to uppercase and print it',
      starterCode: '# Use a string method\n',
      expectedOutput: 'PYTHON PROGRAMMING',
      hint: 'Use the .upper() method on a string',
      solution: "text = 'python programming'\nprint(text.upper())",
      testType: 'exact',
      difficulty: 'advanced',
      points: 20
    },
    {
      levelNumber: 15,
      title: 'Final Challenge',
      description: 'Combine everything you\'ve learned!',
      task: 'Create a list [1,2,3,4,5], loop through it, and print each number doubled',
      starterCode: '# Combine lists and loops\n',
      expectedOutput: '2\n4\n6\n8\n10',
      hint: 'Use a for loop to go through the list and print num * 2',
      solution: 'numbers = [1, 2, 3, 4, 5]\nfor num in numbers:\n    print(num * 2)',
      testType: 'exact',
      difficulty: 'advanced',
      points: 30
    }
  ];

  for (const challenge of challenges) {
    try {
      Challenge.create(challenge);
      console.log(`✓ Created challenge ${challenge.levelNumber}: ${challenge.title}`);
    } catch (error) {
      console.log(`  Challenge ${challenge.levelNumber} already exists, skipping...`);
    }
  }

  console.log('Challenges seeding complete!');
}

async function seedAchievements() {
  console.log('\nSeeding achievements...');

  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first challenge',
      icon: '🎯',
      points: 10,
      condition: { type: 'challenges_completed', count: 1 }
    },
    {
      name: 'Python Novice',
      description: 'Complete 5 challenges',
      icon: '🌱',
      points: 25,
      condition: { type: 'challenges_completed', count: 5 }
    },
    {
      name: 'Python Apprentice',
      description: 'Complete 10 challenges',
      icon: '📚',
      points: 50,
      condition: { type: 'challenges_completed', count: 10 }
    },
    {
      name: 'Python Master',
      description: 'Complete all 15 challenges',
      icon: '🏆',
      points: 100,
      condition: { type: 'challenges_completed', count: 15 }
    },
    {
      name: 'Speed Demon',
      description: 'Complete a challenge in under 2 minutes',
      icon: '⚡',
      points: 50,
      condition: { type: 'time_under', seconds: 120 }
    },
    {
      name: 'Perfectionist',
      description: 'Complete a challenge on first attempt',
      icon: '💎',
      points: 30,
      condition: { type: 'first_attempt', success: true }
    },
    {
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      points: 75,
      condition: { type: 'streak', days: 7 }
    },
    {
      name: 'Dedicated Learner',
      description: 'Maintain a 30-day streak',
      icon: '🌟',
      points: 200,
      condition: { type: 'streak', days: 30 }
    }
  ];

  for (const achievement of achievements) {
    try {
      Achievement.create(achievement);
      console.log(`✓ Created achievement: ${achievement.name}`);
    } catch (error) {
      console.log(`  Achievement "${achievement.name}" already exists, skipping...`);
    }
  }

  console.log('Achievements seeding complete!');
}

async function seedSystemSettings() {
  console.log('\nSeeding system settings...');

  const settings = [
    { key: 'SITE_NAME', value: 'PyHack', category: 'general' },
    { key: 'SITE_DESCRIPTION', value: 'Learn Python through interactive challenges', category: 'general' },
    { key: 'ALLOW_REGISTRATION', value: 'true', category: 'auth' },
    { key: 'REQUIRE_EMAIL_VERIFICATION', value: 'false', category: 'auth' },
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5', category: 'security' },
    { key: 'SESSION_TIMEOUT_DAYS', value: '7', category: 'security' },
    { key: 'POINTS_PER_CHALLENGE', value: '10', category: 'gamification' },
    { key: 'ENABLE_LEADERBOARD', value: 'true', category: 'gamification' }
  ];

  for (const setting of settings) {
    try {
      SystemSetting.upsert(setting.key, setting.value, setting.category);
      console.log(`✓ Set ${setting.key} = ${setting.value}`);
    } catch (error) {
      console.log(`  Error setting ${setting.key}: ${error.message}`);
    }
  }

  console.log('System settings seeding complete!');
}

async function main() {
  try {
    await connectDatabase();

    await seedChallenges();
    await seedAchievements();
    await seedSystemSettings();

    console.log('\n✓ All seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

main();
