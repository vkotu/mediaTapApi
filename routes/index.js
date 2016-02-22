var express = require('express');
var router = express.Router();
var mysql = require('./database');
var passport = require('passport');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/success', function(req, res, next) {
  res.render('success', { title: 'success' });
});
router.get('/failure', function(req, res, next) {
  res.render('failure', { title: 'failure' });
});


router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: "/" , scope: ['email'] }),
    function(req, res) {
      console.log(req.user);
      updateOrCreateUser(req.user,function(msg){
        if(msg.status == 'fail'){
          res.status(500);
          res.send({"msg":msg.msg});
          res.end();
        }else{
          res.status(200);
          res.send({"msg":"Valid Login",accessToken:msg.accessToken});
          res.end();
        }
      });

    }
);

router.get('/auth/google/callback',
    passport.authenticate('google', { scope:
        [ 'https://www.googleapis.com/auth/plus.me','profile','email' ],session: false, failureRedirect: "/"}
    ),
    function(req, res) {
      console.log(req.user);

      updateOrCreateUser(req.user,function(msg){
        if(msg.status == 'fail'){
          res.status(500);
          res.send({"msg":msg.msg});
          res.end();
        }else{
          res.status(200);
          res.send({"msg":"Valid Login",accessToken:msg.accessToken});
          res.end();
        }
      });

    }
);

router.post('/login',
    passport.authenticate('local', { session: false, failureRedirect: "http://localhost:5100/" }),
    function(req, res) {
      console.log(req.user);
      updateOrCreateUser(req.user,function(msg){
        if(msg.status == 'fail'){
          res.status(500);
          res.send({"msg":msg.msg});
          res.end();
        }else{
          res.status(200);
          res.send({"msg":"Valid Login",accessToken:msg.accessToken});
          res.end();
        }
      });
    }
);

function updateOrCreateUser(profile,callback) {
  var accessToken = profile.accessToken;
  var getUser = "select * from userTable where email= ? and provider = ?";
  var email = "emails" in profile ? profile.emails[0].value : profile.email;
  var params = [email,profile.provider];

  console.log("check email" + email);
  mysql.fetchData(getUser,params,function(err,results){
    if(err){
      console.log(err);
      callback ({status:'fail',msg:err});
    }
    else
    {
      if(results.length > 0){
        console.log("Email exists in DB");
        params = [accessToken,profile.provider, email];
        var updQry = "update userTable set token = ?  where provider = ? and email = ? ";
        mysql.execQuery(updQry,params, function(err,results){
          if(err){
            console.log("error singing up");
            callback( {status:'fail',msg:err} );
          }
          else{
            console.log("updated user acces token");
            callback( {status:'ok',accessToken:accessToken} );
          }
        });

      }
      else {
        console.log("no user exists ");
        var insertDetails = "insert into userTable (email,gender,birthday,city,phoneNumber,token,provider,displayName) values (?,?,?,?,?,?,?,?)";
        var params = [email,profile.gender,profile.birthday,null,null,accessToken,profile.provider,profile.displayName];
        mysql.execQuery(insertDetails,params, function(err,results){
          if(err){
            console.log("error singing up");
            return callback({status:'fail',msg:err});
            //throw err;
          }
          else{
            console.log("inserted new user with acces token");
            return callback({status:'ok',accessToken:accessToken});
          }
        });
      }
    }
  });
}





router.get('/getProfile',function(req,res) {
  console.log(req.query.accessToken);
  var qry = "select * from userTable where  token = ?";
  console.log("tkoen is" + req.query.accessToken);
  var params = [req.query.accessToken];
  mysql.fetchData(qry,params,function(err,results){
    if(err){
      var msg = "Error  while getting token" + err;
      console.log(err);
      res.status(500);
      res.send({msg:err});
    }
    else
    {
      if(results.length > 0){
        console.log("token exists");
        //console.log(results);
        //res.redirect('/successSignIn');
        res.status(200);
        res.send({msg:"user found",userDetails:results});
      }
      else {
        res.status(401);
        res.send({msg:"Unauthorized, please login again"});
      }
    }
    res.end();
  });
});





module.exports = router;
//router.post('/signin',afterSignIn);
//function afterSignIn(req,res)
//{
//  // check user already exists
//  var getUser="select * from userTable where email=? and password= ?";
//  console.log(req.body);
//  var email = req.body.email;
//  var password = req.body.password;
//  console.log("email :" + email);
//  email = email.trim();
//
//  var params = [email,password];
//  console.log("Query is:"+getUser);
//
//  mysql.fetchData(getUser,params,function(err,results){
//    if(err){
//      var msg = "Error occurred while logging in " + err;
//      res.status(500);
//      console.log(err);
//      res.send({"status":"fail" , 'msg': msg});
//    }
//    else
//    {
//      if(results.length > 0){
//        console.log("valid Login");
//        console.log(results);
//        //res.redirect('/successSignIn');
//        req.session.userid = results[0].id;
//        console.log("User id : " +req.session.userid );
//        res.status(200);
//        res.send({'msg': "Valid Login"});
//      }
//      else {
//        console.log("Invalid Login");
//        res.statusCode = 401;
//        res.send({'msg':'Invalid password or  Emailid, please verify and try again'});
//      }
//    }
//    res.end();
//  });
//}