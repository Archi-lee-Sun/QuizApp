const db = require('../db/database.js') 
const crypto = require('crypto')

function  identifyUser(req , res , next) {
    let  sessionId = req.cookies.session_id 

    if(!sessionId) {

        sessionId = crypto.randomUUID()
        
        db.prepare('INSERT INTO users(session_id) VALUES(?)').run(sessionId) 

        res.cookie('session_id' , sessionId ,  {
            maxAge: 365 * 24 * 60 * 60 * 1000 ,
            httpOnly: true,
            sameSite: 'lax'
        })
    }
    
    const user = db.prepare('Select * FROM users where session_id = ?').get(sessionId)

    req.sessionId = sessionId 
    req.userId = user.id 
    
    
    next() 
}


module.exports = identifyUser ;