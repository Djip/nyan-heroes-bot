require('dotenv').config();

const express = require('express');
const app = express()
const { callback } = require('./controllers/twitter')

app.get('/twitter/callback', (req, res, next) => {
    callback(req, res, next)
})

if (process.env.NODE_ENV === 'production') {
    app.listen(443)
} else {
    app.listen(2000)
}
