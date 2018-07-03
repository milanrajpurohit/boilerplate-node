/****************************
 EXPRESS AND ROUTING HANDLING
 ****************************/
let express = require('express');
config = require('./configs');
morgan = require('morgan');
compress = require('compression');
bodyParser = require('body-parser');
methodOverride = require('method-override');
session = require('express-session');
jwt = require('jsonwebtoken');
multer = require('multer'); //middleware for handling multipart/form-data
multiparty = require('multiparty'); /*For File Upload*/
cors = require('cors'); //For cross domain error
// crypto = require('crypto');
//CryptoJS = require('node-cryptojs-aes').CryptoJS; //For Encryption and Decryption
fs = require('file-system');
timeout = require('connect-timeout');


module.exports = function() {
    console.log('env' + process.env.NODE_ENV)
    var app = express();
    //console.log(__dirname)
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else if (process.env.NODE_ENV === 'production') {
      app.use(compress({ threshold: 2 }));
    }

    app.use(bodyParser.urlencoded({limit:"50mb",
      extended: true
    }));

    app.use(bodyParser.json({limit:"50mb"}));

    app.use(methodOverride());

    app.use(cors());
    // app.use(morgan('combined')); // Just uncomment this line to show logs.

    // =======   Settings for CORS
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.use(timeout(120000));
    app.use(haltOnTimedout);

    function haltOnTimedout(req, res, next){
      if (!req.timedout) next();
    }

    app.use(session({
      cookie: { maxAge: 30000 },
      saveUninitialized: true,
      resave: true,
      secret: config.sessionSecret
    }));

    // =======   Routing
    require('../app/routes/RegisterRoutes.js')(app, express);
    require('../app/routes/PostRoutes.js')(app, express);
    require('../app/routes/CommentRoutes.js')(app, express);
    require('../app/routes/FollowRoutes')(app, express);
    require('../app/routes/UserRoutes')(app, express);
    require('../app/routes/StoreRoutes')(app, express);
    require('../app/routes/RatingRoutes')(app, express);
    require('../app/routes/SearchRoutes')(app, express);
    require('../app/routes/ReportRoutes')(app, express);
    require('../app/routes/FavouriteRoutes')(app, express);
    require('../app/routes/NotificationRoutes')(app, express);

    return app;
  };
