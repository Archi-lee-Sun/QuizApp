const generateBtn = document.getElementById('generate-btn')
const errorMsg = document.getElementById('error-msg')
const historyGrid = document.getElementById('history-grid')
const historyEmpty = document.getElementById('history-empty')
const topicInput = document.getElementById('topic-input')

const diffbtns = document.querySelectorAll('.diff-btn')
diffbtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffbtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
    })
})

const countbtns = document.querySelectorAll('.count-btn')
countbtns.forEach(btn => {
    btn.addEventListener('click', () => {
        countbtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
    })
})

const trybtns = document.querySelectorAll('.topic-chip')
trybtns.forEach(btn => {
    btn.addEventListener('click', () => {
        topicInput.value = btn.dataset.topic
    })
})

async function loadHistory() {
    const response = await fetch('/api/quiz/history')
    const data = await response.json()

    if(data.quizzes.length === 0) return

    historyEmpty.style.display = 'none'

    data.quizzes.forEach(quiz => {
        const percent = Math.round((quiz.score / quiz.total_questions) * 100)

        const card = document.createElement('div')
        card.className = 'history-card'
        card.innerHTML = `
            <div class="history-card-topic">${quiz.topic}</div>
            <div class="history-card-meta">${quiz.difficulty} · ${quiz.created_at.slice(0,10)}</div>
            <div class="history-card-score">
                <span class="score-num">${quiz.score}</span>
                <span class="score-total">/ ${quiz.total_questions}</span>
            </div>
            <div class="score-bar">
                <div class="score-bar-fill" style="width: ${percent}%"></div>
            </div>
        `
        historyGrid.appendChild(card)
    })
}

loadHistory()

generateBtn.addEventListener('click', async () => {
    errorMsg.textContent = ''

    const topic = topicInput.value.trim()
    const difficulty = document.querySelector('.diff-btn.active').dataset.value
    const count = document.querySelector('.count-btn.active').dataset.value

    if(!topic) {
        errorMsg.textContent = 'Please enter a topic'
        return
    }

    generateBtn.classList.add('loading')
    generateBtn.disabled = true

    try {
        const res = await fetch('/api/quiz/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, difficulty, count })
        })

        const result = await res.json()
        sessionStorage.setItem('quizData', JSON.stringify(result))
        window.location.href = '/quiz.html'

    } catch(error) {
        errorMsg.textContent = 'Something went wrong. Try again.'
        generateBtn.classList.remove('loading')
        generateBtn.disabled = false
    }
})