const express = require('express')
const router = express.Router()
const { generateQuiz, submitAnswer, finishQuiz, getHistory } = require('../controllers/quizController')
const identifyUser = require('../middleware/identifyUser')

router.post('/generate' , identifyUser , generateQuiz)

router.post('/answer' , identifyUser , submitAnswer)

router.post('/finish' , identifyUser , finishQuiz)

router.get('/history' , identifyUser , getHistory)


module.exports = router