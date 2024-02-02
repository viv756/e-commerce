const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/E_COMMERCE");

const config = require('./config/config')

const express = require('express')
const app = express()


const session = require('express-session')

app.use(session({
    secret: config.sessionSecret,
    resave:false,
    saveUninitialized:false,
    cookie: { secure: false },
  }));

// for user routes
const user_route = require('./routes/userRoutes')
app.use('/', user_route)

// for admin route
const admin_route = require('./routes/adminRoutes')
app.use('/admin',admin_route)

app.listen(5000, function () {
    console.log("server running on http://localhost:5000/")
})