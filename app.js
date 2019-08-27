"use strict";



var express = require('express');
var DB = require('./db');
var config = require('./config');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var fs = require('fs');

// var cors = require('cors');
// target: 'node'

const db = new DB("sqlitedb.db")
const app = express();

// app.response = Object.create(myExpress);
const router = express.Router();


router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
//We have required all the packages we need for our application, 
//defined the database, created an express server and an express router.

// CORS middleware

const allowCrossDomain = function(req, res, next) { 
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}
    
app.use(allowCrossDomain)


router.post('/login', (req, res) => {
    console.log('whats up')    
    db.selectByEmail(req.body.email, (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found!!.');
        //we use bcrypt to compare our hashed password with the user supplied password
            
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.user_pass);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        let token = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({ auth: true, token: token, user: user });
       
        console.log('Logged in in: '+ res.status);    
    });
})

router.post('/sign-in', function(req, res) {
    if (req.body.is_stylist == 1) {
        console.log(req.body.is_stylist);
        db.insertStylist([
            req.body.firstName,
            req.body.secondName,
            req.body.email,
            bcrypt.hashSync(req.body.password, 8),
            1
        ],
        function (err) {
            if (err) return res.status(500).send("There was a problem registering the user the user you sent me idiot.")
            db.selectByEmail(req.body.email, (err,user) => {
                if (err) return res.status(500).send("There was a problem getting user")
                let token = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 // expires in 24 hours 
                });
                // if(err) return res.status(422).send('user already exist')
                res.status(200).send({ auth: true, token: token, user: user });    
            }); 
        }); 
    } else {
        db.insert([
            req.body.firstName,
            req.body.secondName,
            req.body.email,
            bcrypt.hashSync(req.body.password, 8),
            0
        ],
        function (err) {
            if (err) return res.status(500).send("There was a problem registering the user you sent me.")
            db.selectByEmail(req.body.email, (err,user) => {
                if (err) return res.status(500).send("There was a problem getting user")
                let token = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).send({ auth: true, token: token, user: user });
            }); 
        });
    }
});
   
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {}; 
  
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
  
    return response;
  }

router.post('/stylistprofile',function(req, res) {
        // 1. convert req.body.image to an image (./image/randomimagename)
            let buffer = decodeBase64Image(req.body.image)
            let extension = req.body.image.split(",")[0].replace("data:image/", "").replace(";base64", "")
            let imageName = new Date().getTime() + "." + extension
            // console.log(imageName)
            fs.writeFileSync("images/" + imageName, buffer.data)
            // let imageName = "Awesomeimage.jpg"
            req.body.image = imageName; 

            db.insertStylistProfile([
                req.body.image,      
                req.body.name,
                req.body.workplace,
                req.body.description,      
                req.body.services,
                req.body.submitted
            ],     
                  
            function (err) {   
                if (err) return res.status(500).send(err)
                // req.body.id =id;     
                db.selectById(req.body.id, (err,stylist_profile) => {
                    console.log("whats up now")  
                    if (err) return res.status(500).send(err)
                    let token = jwt.sign({id:stylist_profile.id }, config.secret, { expiresIn: 86400 // expires in 24 hours
                    });   
                res.status(200).send({auth: true, token: token, stylist_profile: stylist_profile });
                });       
            });

        // } else {
        //     res.status(422).send("No data sent")
        // }
        // (err) =>{        
        //     console.log(err);
        //     // console.log(res)
        // } 
    });  
    // var request = require('request');
    // request('/stylistprofile', function(error, res, req, body){    
    //     if (!error && response.statusCode == 200){
    //         console.log(body)
    //     }
    // })
    

router.get('/stylistprofile/:id', function(req, res) {
    if(req.body.submitted == 1){
    
    db.selectById(req.body.id, (err,stylist_profile) =>{
        if(err) return res.status(500).send(err);
        let idMatch = req.body.id === stylist_profile.id;
        if(!idMatch)return res.status(401).send({auth:false, token:null});
        let token =jwt.sign({id:stylist_profile.id}, config.secret, {
            expiresIn:86400});   
        res.status(200).send({auth: true, token: token, stylist_profile: stylist_profile, id:''});   
    })
}
})



//use the express server to make our application accessible
app.use(router)
app.use(express.static('images'))
//We created a server on port: 3000 or any dynamically generated port by our system 
let port = process.env.PORT || 3000;

let server = app.listen(port, function() {
    console.log('Express server listening on port ' + port)
});
