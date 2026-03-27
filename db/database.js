const Database = require('better-sqlite3');
const db = new Database('database.db');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      times_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total_questions INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS seen_questions (
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      quiz_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer INTEGER DEFAULT NULL,
      is_correct INTEGER DEFAULT NULL,
      PRIMARY KEY (quiz_id, question_id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);

  console.log('Database initialized successfully');
}

initializeDatabase();

module.exports = db;