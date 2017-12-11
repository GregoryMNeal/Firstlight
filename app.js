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

// get method for login
app.get('/login', function (req, resp, next) {
  req.session.destination = '/mlog'; // route to log history after login
  var context = {title: 'Sign in',
    uname: '',
    errmsg: ''
  };
  resp.render('login.hbs', context);
});

// post method for login
app.post('/login', function (req, resp, next) {
  var username = req.body.username; // get user name from the form
  var password = req.body.password; // get password from the form
  var q = 'SELECT * from trainee WHERE email = $1';
  db.one(q, username) // sanitize SQL statement
    .then(function (result) {
      // validate password
      var db_pwd = result.pword;
      var pwd_parts = db_pwd.split('$');
      var key = pbkdf2.pbkdf2Sync(
        password,
        pwd_parts[2],
        parseInt(pwd_parts[1]),
        256,
        'sha256'
      );
      var hash = key.toString('hex');
      if (hash === pwd_parts[3]) {
        req.session.user = username; // set up a user session
        req.session.login_name = result.name;
        req.session.trainee_id = result.id;
        resp.redirect('/listmeasurements/' + result.id);
      } else {
        var context = {title: 'Sign in',
          uname: username,
          errmsg: 'Incorrect password.'
        };
        resp.render('login.hbs', context);
      }
    })
    .catch(function (error) {
      var context = {title: 'Sign in',
        uname: username,
        errmsg: 'Incorrect login.'
      };
      resp.render('login.hbs', context);
    });
});

// get method for account creation form
app.get('/create_acct', function (req, resp, next) {
  var context = {title: 'Create Account',
    name: '',
    email: '',
    errmsg: ''
  };
  resp.render('createacct.hbs', context);
});

// post method for account creation form
app.post('/create_acct', function (req, resp, next) {
  // Get input from form
  var form_name = req.body.name;
  var form_email = req.body.email;
  var form_password = req.body.password;
  var form_confirmpwd = req.body.confirmpwd;
  if (form_password != form_confirmpwd) {
    var context = {title: 'Create Account',
      name: form_name,
      email: form_email,
      errmsg: 'Passwords do not match.'};
    resp.render('createacct.hbs', context);
  } else {
    var salt = crypto.randomBytes(20).toString('hex');
    var pwd = form_password;
    var key = pbkdf2.pbkdf2Sync(pwd, salt, 36000, 256, 'sha256');
    var hash = key.toString('hex');
    var encrypted_pwd = `pbkdf2_sha256$36000$${salt}$${hash}`;
    var trainer_id = 1;
    var trainee_info = {
      name: form_name,
      email: form_email,
      password: encrypted_pwd,
      trainer: trainer_id
    };
    var q = 'INSERT INTO trainee \
      VALUES (default, ${name}, ${email}, NULL, NULL, NULL, ${password}, ${trainer}) RETURNING id';
    db.one(q, trainee_info)
      .then(function (result) {
        req.session.user = form_email; // set up a user session
        req.session.login_name = form_name;
        req.session.trainee_id = result.id;
        // redirect to history page
        resp.redirect('/listmeasurements/' + result.id);
      })
      .catch(next);
  }
});

// Display history for a trainee
app.get('/listmeasurements/:id', function (req, resp, next) {
  var id = req.params.id;
   var q = 'SELECT trainee.id as id, trainee.name, measurements.* FROM trainee \
   LEFT JOIN measurements ON trainee.id = measurements.trainee_id \
   WHERE trainee.id = $1';
  db.any(q, id)
    .then(function (results) {
      resp.render('listmeasurements.hbs', {
        title: 'History',
        results: results,
        login_name: req.session.login_name});
    })
    .catch(next);
});

// get method for adding measurements for a trainee
app.get('/addmeasurements', function (req, resp, next) {
  var id = req.query.id;
  var q = 'SELECT trainee.id as id, trainee.name FROM trainee \
  LEFT JOIN measurements ON trainee.id = measurements.trainee_id \
  WHERE trainee.id = $1';
  db.any(q, id)
    .then(function (results) {
      resp.render('addmeasurements.hbs', {
        title: 'Add Measurements',
        id: id,
        results: results,
        login_name: req.session.login_name});
    })
    .catch(next);
});

// post method for adding measurements
app.post('/addmeasurements', function (req, resp, next) {
  // Get input from form
  var measurement_data = {
    measure_date: req.body.date,
    height_ft: req.body.feet,
    height_in: req.body.inches,
    weight: req.body.currweight,
    caliper_chest: req.body.calchest,
    caliper_subscap: req.body.calsubscap,
    caliper_abd: req.body.calabdomen,
    caliper_suprillac: req.body.calsuprillac,
    caliper_thigh: req.body.calthigh,
    caliper_lowback: req.body.callowerback,
    caliper_bicep: req.body.calbicep,
    caliper_calf: req.body.calcalf,
    caliper_tricep: req.body.caltricep,
    girth_shoulders: req.body.girthshoulders,
    girth_chest: req.body.girthchest,
    girth_waist: req.body.girthwaist,
    girth_hips: req.body.girthhips,
    girth_thigh_l: req.body.girthlthigh,
    girth_thigh_r: req.body.girthrthigh,
    girth_calf_l: req.body.girthlcalf,
    girth_calf_r: req.body.girthrcalf,
    girth_bicep_l: req.body.girthlbicep,
    girth_bicep_r: req.body.girthrbicep,
    fat_lbs: req.body.fatlbs,
    lean_mass: req.body.leanmass,
    body_fat_pct: req.body.bodyfatpct,
    trainee_id: req.body.id
  };
  var q = 'INSERT INTO measurements \
    VALUES (default, ${measure_date}, ${height_ft}, ${height_in}, ${weight}, ${caliper_chest}, ${caliper_subscap}, ${caliper_abd}, ${caliper_suprillac}, ${caliper_thigh}, ${caliper_lowback}, ${caliper_bicep}, ${caliper_calf}, ${caliper_tricep}, ${girth_shoulders}, ${girth_chest}, ${girth_waist}, ${girth_hips}, ${girth_thigh_l}, ${girth_thigh_r}, ${girth_calf_l}, ${girth_calf_r}, ${girth_bicep_l}, ${girth_bicep_r}, ${fat_lbs}, ${lean_mass}, ${body_fat_pct}, ${trainee_id}) RETURNING id';
    db.one(q, measurement_data)
      .then(function (result) {
        resp.redirect('/listmeasurements/' + req.body.id);
      })
      .catch(next);
});

// get method for changing measurements for a trainee
app.get('/chgmeasurements/:id', function (req, resp, next) {
  var id = req.params.id;
  var q = 'SELECT trainee.id as id, trainee.name, measurements.* FROM trainee \
  LEFT JOIN measurements ON trainee.id = measurements.trainee_id \
  WHERE measurements.id = $1';
  db.any(q, id)
    .then(function (results) {
      resp.render('chgmeasurements.hbs', {
        title: 'Change Measurements',
        id: id,
        results: results,
        login_name: req.session.login_name});
    })
    .catch(next);
});

// get method for signout
app.post('/signout', function (req, resp, next) {
  req.session.destroy(function (err) {
  });
  resp.redirect('/');
});

// Listen for requests
app.listen(8000, function() {
  console.log('* Listening on port 8000 *')
});
