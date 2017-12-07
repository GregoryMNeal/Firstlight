// Firstlight Fitness App

// Imports
var express = require('express'); // used to make an Express app
var app = express(); // make the app
var session = require('express-session'); // used for user login
var pgp = require('pg-promise')({
  // initialization options
}); // used for accessing the database
var db = pgp({database: 'firstlight'}); // also used for accessing the database
var body_parser = require('body-parser'); // used to retrieve input from HTML forms
var pbkdf2 = require('pbkdf2'); // used to encrypt password
var crypto = require('crypto'); // used to encrypt password

// Application setup
app.set('view engine', 'hbs'); // use handlebars for template rendering
app.use(express.static('public')); // Setup express to serve the files in the public folder
app.use(body_parser.urlencoded({extended: false}));

// saves a session
app.use(session({
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 60000}
}));

// get method for root URL:/
app.get('/', function (req, resp, next) {
  var context = {
    title: 'Firstlight Fitness',
    login_name: req.session.login_name
  };
  resp.render('index.hbs', context);
});

// Listen for requests
app.listen(8000, function() {
  console.log('* Listening on port 8000 *')
});
