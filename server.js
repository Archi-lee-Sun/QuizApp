require('dotenv').config()

const express = require('express')
const cookie_parser = require('cookie-parser')
const quiz_router = require('./routes/quiz')


const app = express()

app.use(express.json())
app.use(cookie_parser())
app.use(express.static('public'))

app.use('/api/quiz' , quiz_router)

app.listen(process.env.PORT, () => {
    console.log("Server running on port 8001")
})