const db = require('../db/database.js') 

async function generateQuiz(req , res){
  try {

    const topic = req.body.topic
    const difficulty = req.body.difficulty
    const number_of_questions = req.body.count || 10
    const userId = req.userId

    const quiz_questions = db.prepare(`
        SELECT q.* FROM questions q 
        LEFT JOIN seen_questions sq 
        ON q.id = sq.question_id 
        AND sq.user_id = ?
        WHERE q.topic = ? 
        AND q.difficulty = ?
        AND sq.question_id IS NULL
        LIMIT ?
    `).all(userId, topic, difficulty , number_of_questions)
    

    if(quiz_questions.length < number_of_questions){

      const needed = number_of_questions - quiz_questions.length 
        
      const prompt = `
      ### ROLE
You are a Senior Question Architect for "University Challenge" and "Mastermind." You write questions for experts who despise surface-level trivia. 

### OBJECTIVE
Generate exactly ${needed} rigorous, fact-based questions on "${topic}" at ${difficulty} difficulty.

### THE "TRIVIA MASTER" RULES:
1. **NO SURFACE FACTS:** Never ask for the most famous name, date, or event. Instead, ask for the *condition* surrounding it, the *person who came second*, or the *specific anomaly* that occurred.
2. **THE SPOILER TECHNIQUE:** Start questions with a sophisticated fact to "set the stage," then ask for a related, deeper detail. (e.g., "While Pelé is famous for the 1958 Final, which teammate actually scored the first goal of that match?")
3. **HOMOGENEOUS DISTRACTORS:** All 4 options must belong to the same "set." If the answer is a 19th-century French author, all distractors MUST be 19th-century French authors. Never mix categories.
4. **FACTUAL INFLEXIBILITY:** You are a stickler for academic accuracy. You must distinguish between nuanced labels (e.g., distinguishing between 'Existentialist' and 'Absurdist' or 'Realist').
5. **ELIMINATE VAGUENESS:** Avoid "Why" or "How" questions that lead to long-winded analysis. Every question must have a "Locked" factual answer.

### DIFFICULTY CALIBRATION:
- **EASY:** Accessible to a regular hobbyist. No "obvious" general knowledge.
- **MEDIUM:** Requires specific knowledge of eras, rosters, or sub-genres.
- **HARD:** Requires "Deep-Cut" knowledge—obscure records, specific technicalities, or the 'reason' behind a famous exclusion or failure.

### OUTPUT SPECIFICATION:
Return ONLY a JSON array. No markdown. No intro. No outro.
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct_index": number,
    "explanation": "Provide the 'insider knowledge' that makes this fact interesting. Mention why the trap options are plausible."
  }
]
` 
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
      })
      

      const data = await response.json()

      if (data.error) {
          console.error("FULL ERROR:", JSON.stringify(data.error, null, 2))
          return res.status(400).json({ error: "AI API Error", details: data.error })
      }

      const rawText = data.choices[0].message.content
      
      const parsed = JSON.parse(rawText)
      const newQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || Object.values(parsed)[0])

      for(let i = 0; i < newQuestions.length; i++){
      const q = newQuestions[i]

      if(!q.question || !q.options || !q.explanation) continue

      const result = db.prepare(`
        INSERT INTO questions(topic, difficulty, question, options, correct_index, explanation)
        VALUES(?,?,?,?,?,?)
      `).run(
        topic,
        difficulty,
        q.question,
        JSON.stringify(q.options),
        q.correct_index,
        q.explanation
      )

      quiz_questions.push({
        id: result.lastInsertRowid,
        topic,
        difficulty,
        question: q.question,
        options: JSON.stringify(q.options),
        correct_index: q.correct_index,
        explanation: q.explanation
      })
      }
    }
    
    const quizResult = db.prepare(`INSERT INTO quizzes(user_id,topic,difficulty,total_questions) VALUES(?,?,?,?)`).run(userId, topic, difficulty, number_of_questions)
    const quizId = quizResult.lastInsertRowid

    for(let i = 0 ;  i < quiz_questions.length ; i++){
        db.prepare(`
            INSERT INTO seen_questions(user_id,question_id) VALUES(?,?)
            `).run(userId , quiz_questions[i].id)
        
        db.prepare(`INSERT INTO quiz_questions(quiz_id,question_id) VALUES(?,?)`).run(quizId , quiz_questions[i].id)
    }

    const formattedQuestions = quiz_questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }))
        
    res.json({
        quizID : quizId,
        questions : formattedQuestions
    })


  } catch(error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong in generateQuiz' })
  }
}


async function submitAnswer(req, res) {
  try {
    const quizId = req.body.quizId
    const questionId = req.body.questionId
    const selectedOption = req.body.selectedOption

    const currQuestion = db.prepare(`
      SELECT * FROM questions
      WHERE id = ?
    `).get(questionId)

    const isCorrect = currQuestion.correct_index === selectedOption
    const isCorrectInt = isCorrect ? 1 : 0

    db.prepare(`
      UPDATE quiz_questions
      SET user_answer = ?,
      is_correct = ?
      WHERE quiz_id = ? AND question_id = ?
    `).run(selectedOption, isCorrectInt, quizId, questionId)

    if(isCorrect) {
      db.prepare(`
        UPDATE quizzes
        SET score = score + 1
        WHERE id = ? AND user_id = ?
      `).run(quizId, req.userId)
    }

    res.json({
      isCorrect: isCorrect,
      correctIndex: currQuestion.correct_index,
      explanation: currQuestion.explanation
    })

  } catch(error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

async function finishQuiz(req, res) {
  try{
    const quizId = req.body.quizId
    const userId = req.userId

    const currQuiz = db.prepare(`
      SELECT * FROM quizzes
      WHERE id = ? AND user_id = ?
      `).get(quizId , userId)

      

    if(!currQuiz){
      return res.status(404).json({ error: 'Quiz not found' })
    } 

    const score = currQuiz.score
    const totalQuestions = currQuiz.total_questions

    db.prepare(`
      UPDATE quizzes
      set completed = ? 
      WHERE id = ? AND user_id = ?
      `).run(1 , quizId , userId)


    res.json({
      score : score ,
      total_questions : totalQuestions ,
    })
  } catch(error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}
async function getHistory(req, res) {
  try {
    const userId = req.userId

    const userQuizzes = db.prepare(`
      SELECT topic, difficulty, score, total_questions, created_at 
      FROM quizzes
      WHERE user_id = ? AND completed = 1
      ORDER BY created_at DESC
    `).all(userId)

    res.json({
      quizzes: userQuizzes
    })

  } catch(error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
}

module.exports = { generateQuiz, submitAnswer, finishQuiz, getHistory }