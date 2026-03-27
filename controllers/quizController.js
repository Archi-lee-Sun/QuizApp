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
You are an expert-level quiz creator with the mindset of a critic, historian, and domain specialist — similar to how a top film critic, scientist, or analyst would think deeply about a subject.

Generate exactly ${needed} high-quality quiz questions about ${topic} at ${difficulty} difficulty.

CORE GOAL:
The questions must feel интеллектуally rich, non-obvious, and insightful — not like typical trivia. Each question should reveal something surprising, subtle, or misunderstood about the topic.

STRICT RULES:

1. QUESTION QUALITY
- Avoid generic, overused, or surface-level questions.
- Focus on lesser-known facts, hidden details, paradoxes, or nuanced understanding.
- Questions should feel like they come from an expert, not a textbook.
- If possible, include "why", "how", or conceptual traps rather than pure memorization.

2. OPTIONS (CRITICAL)
- Provide exactly 4 options.
- All wrong answers must be plausible and intellectually tempting.
- Avoid obviously incorrect or joke answers.
- Options should be similar in structure and length.
- Include at least one "trap" option that reflects a common misconception.

3. CORRECT ANSWER
- Ensure only ONE correct answer.
- Avoid ambiguity.

4. EXPLANATION (VERY IMPORTANT)
- Explanation must teach something NEW or counterintuitive.
- Do not repeat the question.
- Explain WHY the correct answer is correct AND why others are wrong (briefly).
- Make the explanation feel like insight from an expert (e.g., critic-level thinking).

5. DIFFICULTY CONTROL
- EASY → still interesting, but accessible
- MEDIUM → requires some reasoning or deeper knowledge
- HARD → requires expert-level insight, subtle distinctions, or multi-step thinking

6. DIVERSITY
- Do not repeat patterns or question styles.
- Mix conceptual, analytical, and detail-based questions.

OUTPUT FORMAT (STRICT):
Return ONLY a valid JSON array. No markdown, no commentary, no extra text.

Each object must have EXACTLY this structure:

{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correct_index": number (0-3),
  "explanation": "string"
}
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
      
      const newQuestions = JSON.parse(rawText)

      for(let i = 0; i < newQuestions.length; i++){
      const q = newQuestions[i]

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