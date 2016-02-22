var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var session = require('express-session');
var app = express();
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jwt-simple');
var secretKey = "venkat";
app.use(passport.initialize());
app.use(passport.session());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'ssshhhhh',resave: false,saveUninitialized: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    next();
});


var options = {
  clientID: "951441061612058",
  clientSecret: "c1236b7cc77985bcff4a905f8a8db8f9",
  callbackURL: 'http://localhost:5200/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'name', 'photos', 'gender', 'emails']
};
var mysql = require('./routes/database');

passport.use(
    new FacebookStrategy(
        options,
        function(accessToken, refreshToken, profile, done) {
         // console.log(profile);
          profile.accessToken = accessToken;
          return done(null,profile);
        }
    )
);
passport.use(new GoogleStrategy({
      clientID:     "473150600796-l3tult83kap602lfuppu6sgi3tp8om0b.apps.googleusercontent.com",
      clientSecret: "1AZ2yxGSGgUEh49npYCszK1y",
      callbackURL: "http://localhost:5200/auth/google/callback",
      passReqToCallback   : true,
      profileFields: ['gender']
    },
    function(request, accessToken, refreshToken, profile, done) {
     // console.log(accessToken);
      profile.accessToken = accessToken;
      //console.log("gender => " + profile.gender);
      return done(null,profile);
    }
));

passport.use(new LocalStrategy({usernameField: 'email',passwordField: 'password',session:false,passReqToCallback:true},
    function(req,username, password, done) {
        var getUser="select * from userTable where email=? and password= ?";
        params = [username,password]
        mysql.fetchData(getUser,params,function(err,results){
            if(err){
                var msg = "Error occurred while logging in " + err;
                return done(msg);
            }
            else
            {
                if(results.length > 0){
                    console.log("valid Login");
                    console.log(results[0]);
                    var user = results[0];
                    user.provider = 'local';
                    var id = user.id;
                    var token = jwt.encode(id, secretKey);
                    user.accessToken = token;
                    return done(null,user)
                }
                else {
                    console.log("Invalid Login");
                    return done(null,false);
                }
            }
        });
    }
));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var server = app.listen(5200, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port)

});




// Initialize Passport and restore authentication state, if any, from the
// session.


module.exports = app;
