require('dotenv').config();

const express = require('express');
const app = express()
const { callback, missionTwo } = require('./controllers/twitter')

app.get('/link-twitter', (req, res, next) => {
    callback(req, res, next)
})
app.get('/mission-two', (req, res, next) => {
    missionTwo(req, res, next)
})

app.listen(process.env.PORT)
