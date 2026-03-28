const quizData = JSON.parse(sessionStorage.getItem('quizData'))
const questions = quizData.questions
const quizId = quizData.quizID

let currentIndex = 0

console.log('quizData:', quizData)

if(!quizData || !quizData.questions || quizData.questions.length === 0) {
    alert('Quiz generation failed. Please try again.')
    window.location.href = '/'
}

const loadingScreen = document.getElementById('loading-screen')
const loadingTopic = document.getElementById('loading-topic')
const quizScreen = document.getElementById('quiz-screen')
const resultsScreen = document.getElementById('results-screen')

const questionNum = document.getElementById('question-num')
const questionText = document.getElementById('question-text')
const quizCounter = document.getElementById('quiz-counter')
const quizMeta = document.getElementById('quiz-meta')
const progressFill = document.getElementById('progress-fill')
const optionsGrid = document.getElementById('options-grid')

const explanationBox = document.getElementById('explanation-box')
const explanationText = document.getElementById('explanation-text')
const nextBtn = document.getElementById('next-btn')
const nextBtnText = document.getElementById('next-btn-text')

const resultsScore = document.getElementById('results-score')
const resultsTotal = document.getElementById('results-total')
const resultsMessage = document.getElementById('results-message')
const resultsBarFill = document.getElementById('results-bar-fill')


function showQuestion(index) {
    const question = questions[index]

    questionNum.textContent = `Q${String(index + 1).padStart(2, '0')}`
    questionText.textContent = question.question
    quizCounter.textContent = `${index + 1} / ${questions.length}`
    quizMeta.textContent = `${question.topic.toUpperCase()} · ${question.difficulty.toUpperCase()}`

    const percent = (index / questions.length) * 100
    progressFill.style.width = `${percent}%`

    explanationBox.classList.add('hidden')
    optionsGrid.innerHTML = ''

    const letters = ['A', 'B', 'C', 'D']
    question.options.forEach((option, i) => {
        const btn = document.createElement('button')
        btn.className = 'option-btn'
        btn.innerHTML = `
            <span class="option-letter">${letters[i]}</span>
            <span>${option}</span>
        `
        btn.addEventListener('click', () => handleAnswer(question.id, i, btn))
        optionsGrid.appendChild(btn)
    })
}


async function handleAnswer(questionId, selectedOption, clickedBtn) {
    const allBtns = optionsGrid.querySelectorAll('.option-btn')
    allBtns.forEach(btn => btn.disabled = true)

    const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quizId: quizId,
            questionId: questionId,
            selectedOption: selectedOption
        })
    })

    const result = await res.json()

    if(result.isCorrect) {
        clickedBtn.classList.add('correct')
    } else {
        clickedBtn.classList.add('wrong')
        allBtns[result.correctIndex].classList.add('correct')
    }

    explanationText.textContent = result.explanation
    explanationBox.classList.remove('hidden')

    if(currentIndex === questions.length - 1) {
        nextBtnText.textContent = 'See Results'
    } else {
        nextBtnText.textContent = 'Next Question'
    }
}


async function showResults() {
    const res = await fetch('/api/quiz/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quizId })
    })

    const data = await res.json()

    quizScreen.classList.add('hidden')
    resultsScreen.classList.remove('hidden')

    resultsScore.textContent = data.score
    resultsTotal.textContent = `/ ${data.total_questions}`

    const percent = Math.round((data.score / data.total_questions) * 100)

    if(data.score === data.total_questions) {
        resultsMessage.textContent = 'Perfect score! Absolutely outstanding.'
    } else if(data.score >= data.total_questions / 2) {
        resultsMessage.textContent = 'Good job! You know your stuff.'
    } else {
        resultsMessage.textContent = 'Keep practicing. Every attempt teaches you something.'
    }

    setTimeout(() => {
        resultsBarFill.style.width = `${percent}%`
    }, 100)

    sessionStorage.removeItem('quizData')
}


nextBtn.addEventListener('click', () => {
    currentIndex++

    if(currentIndex < questions.length) {
        showQuestion(currentIndex)
    } else {
        showResults()
    }
})



loadingTopic.textContent = questions[0].topic.toUpperCase()

setTimeout(() => {
    loadingScreen.classList.add('hidden')
    quizScreen.classList.remove('hidden')
    showQuestion(0)
}, 1500)