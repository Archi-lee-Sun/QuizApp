🧠 QuizMind — AI-Powered Deep Knowledge Quiz App
QuizMind is an intelligent quiz generation platform that creates non-trivial, expert-level questions on any topic using AI. Unlike typical quiz apps, it avoids surface-level trivia and focuses on deep, nuanced knowledge.

🚀 Features
🎯 Dynamic Quiz Generation

Generate quizzes on any topic
Choose difficulty: easy, medium, hard
Select number of questions (5 / 10 / 15)

🧠 AI-Generated Deep Questions

Uses Groq (LLM) to generate high-quality, non-obvious questions
Designed with strict prompt engineering:

No basic trivia
Context-based questioning
Plausible distractors
Expert-level explanations

📚 Smart Question Pool System

Avoids repeating previously seen questions
Stores generated questions in database
Reuses high-quality questions efficiently

📊 Quiz Tracking

Real-time answer validation
Score calculation
Quiz completion tracking

🕘 History System

View past quizzes
Track performance over time

🏗️ Tech Stack

Backend
Node.js (Express)
SQLite (better-sqlite3)
Groq API (LLM for question generation)

Frontend
HTML / CSS (AI-assisted design)
Vanilla JavaScript (collaborative — human logic, AI syntax assistance)

Architecture Style
REST API
MVC-like structure:

controllers/
routes/
middleware/
db/

📂 Project Structure
.
├── controllers/        # Core logic (quiz generation, answers, history)
├── routes/             # API endpoints
├── middleware/         # Request handling / user identification
├── db/                 # Database setup (SQLite)
├── public/             # Frontend (HTML, CSS, JS)
├── server.js           # Entry point
├── package.json

🧩 How It Works
1. Quiz Generation Flow

User submits:
topic
difficulty
number of questions


Backend:
Fetches unseen questions from DB
If not enough → calls AI (Groq)


AI generates:
Structured JSON questions
With options + explanations


Questions are:
Stored in database
Linked to the quiz
Marked as "seen" for the user


2. Answer Flow
User selects an answer

Backend:
Checks correctness
Updates quiz state
Returns explanation instantly



4. Completion

Final score is calculated
Quiz marked as completed
Stored in history


🧠 AI Prompt Engineering
The system uses a carefully designed prompt to ensure high-quality questions:

Avoids obvious facts
Forces contextual reasoning
Reveals counterintuitive insights in explanations
Ensures plausible, intellectually tempting wrong answers
Provides expert-level explanations that teach something new

This transforms the app from a simple quiz into a genuine knowledge challenge system.

🗄️ Database Design
Key Tables

users → session-based user identification
questions → AI-generated and stored questions
quizzes → quiz sessions per user
quiz_questions → maps questions to quizzes + stores answers
seen_questions → prevents question repetition per user


⚡ Key Backend Highlights

Efficient SQL queries (LEFT JOIN + filtering unseen questions)
AI fallback when DB lacks sufficient data
Safe JSON parsing from LLM responses
Clean separation of concerns (routes / controllers / middleware)
Incremental scoring system


🎨 UI/UX Philosophy

Minimal, high-contrast dark design
Focus on thinking, not distraction
Smooth transitions and answer feedback
Clear hierarchy: Question → Options → Insight


🤖 AI Usage Philosophy
This project uses AI as a collaborative assistant, not as a replacement for engineering.

✅ Backend architecture, database design, and core logic — fully implemented by me
🤝 AI (Claude) was used for:

Brainstorming and idea refinement
Prompt engineering iteration
Debugging assistance and second opinions


🎨 Frontend HTML/CSS — AI-assisted design
⚙️ Frontend JavaScript — built collaboratively

The key focus was maintaining full ownership of system design and logic while leveraging AI to accelerate iteration and improve quality.

🧑‍💻 Author
Backend-focused developer with strong interest in:

System design and backend architecture
AI-assisted development workflows
Prompt engineering

This project reflects a modern development approach — the system is engineered by me. AI is used deliberately as a tool for thinking, not for outsourcing responsibility.

💡 Engineering Perspective
A core goal of this project was to explore:

How to integrate LLMs into real backend systems
How to control AI output via strict prompt design
How to combine deterministic systems (SQL, logic) with probabilistic systems (LLMs)
