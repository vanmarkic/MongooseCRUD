// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express'); // call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');

var Bear = require('./models/bear');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config/config');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//CORS REQUEST HANDLING
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, \ Authorization');
    next();
});

let dbaddress = "mongodb://dragan:dragan98@ds041494.mlab.com:41494/bear"
mongoose.connect(dbaddress, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => mongoose.connect( 'mongodb://localhost:27017/bear', {
        useNewUrlParser: true
    }).then(() => console.log('connected locally after firewall error')));

app.set('superSecret', config.secret); // secret variable

// use morgan to log requests to the console
app.use(morgan('dev'));

var port = process.env.PORT || 8080; // set our port


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the coolest API on earth!'
    });
});

router.route('/setup')
    .post(function (req, res) {
        var bear = new Bear(); // create a new instance of the Bear model
        bear.name = req.body.name; // set the bears name (comes from the request)
        bear.password = req.body.password; 
        bear.admin = true; 
        // save the bear and check for errors
        bear.save(function (err) {
            if (err)
                res.send(err);

            res.json({
                message: 'Bear created!'
            });
        });

    });

// app.get('/setup', function (req, res) {

//     // create a sample user
//     var nick = new Bear({
//         name: req.body.name,
//         password: req.body.password,
//         admin: true
//     });

//     console.log(nick);

//     // save the sample user
//     nick.save(function (err) {
//         if (err) throw err;

//         console.log('User saved successfully');
//         res.json({
//             success: true
//         });
//     });
// });

// middleware to use for all requests
router.use(function (req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});



// app.post('/setup', function (req, res) {

//     // create a sample user
//     var nick = new Bear({
//         name: req.body.name,
//         password: req.body.password,
//         admin: true
//     });

//     // save the sample user
//     nick.save(function (err) {
//         if (err) throw err;

//         console.log('User saved successfully');
//         res.json({
//             success: true
//         });
//     });
// });


// basic route



// route to authenticate a user (POST http://localhost:8080/api/authenticate)
router.post('/authenticate', function (req, res) {
    // find the user
    console.log("postauthroute");
    Bear.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({
                success: false,
                message: '!! User not found.'
            });
        } else if (user) {
            // check if password matches
            if (user.password != req.body.password) {
                res.json({
                    success: false,
                    message: '!! Wrong password.'
                });
            } else {
                // if user is found and password is right
                // create a token with only our given payload
                // we don't want to pass in the entire user since that has the password
                const payload = {
                    admin: user.admin
                };
                var token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: 60 * 60 * 24 // expires in 24 hours
                });
                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }

    });
});

// route middleware to verify a token
router.use(function (req, res, next) {

    console.log("tokenverifroute");
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


// router.route('/bears')
//     .post(function (req, res) {
//         var bear = new Bear(); // create a new instance of the Bear model
//         bear.name = req.body.name; // set the bears name (comes from the request)
//         // save the bear and check for errors
//         bear.save(function (err) {
//             if (err)
//                 res.send(err);

//             res.json({
//                 message: 'Bear created!'
//             });
//         });

//     });

// router.route('/bears')
//     .get((req, res) => {
//         Bear.find((err, bears) => {
//             if (err)
//                 res.send(err);
//             res.json(bears);
//         });
//     });

// router.route('/bears/:bear_id')
//     // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
//     .get((req, res) => {
//         Bear.findById(req.params.bear_id, (err, bear) => {
//             if (err)
//                 res.send(err);
//             res.json(bear);
//         });
//     });

router.route('/bears/:bear_id').put((req, res) => {
        Bear.findById(req.params.bear_id, (err, bear) => {
            if (err)
                res.send(err);
            bear.name = req.body.name; // update the bears info
            bear.save((err) => {
                if (err)
                    res.send(err);
                res.json({
                    message: 'Bear updated!'
                });
            });

        });
    });

// router.route('/bears/:bear_id')
//     .delete(function (req, res) {
//         Bear.findById(req.params.bear_id, (err, bear) => {
//             if (err)
//                 res.send(err);
//             bear.name = req.body.name; // update the bears info
//             bear.remove((err) => {
//                 if (err)
//                     res.send(err);
//                 res.json({
//                     message: 'Bear deleted!'
//                 });
//             });

//         });
//     });

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function (req, res) {
//     res.json({
//         message: 'hooray! welcome to our api!'
//     });







// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)

// TODO: route middleware to verify a token

// route to show a random message (GET http://localhost:8080/api/)
router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the coolest API on earth!'
    });
});

// route to return all users (GET http://localhost:8080/api/users)
router.get('/users', function (req, res) {
    Bear.find({}, function (err, users) {
        res.json(users);
    });
});






app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// more routes for our API will happen here






// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);