/*******************************
 REGISTER ROUTING INITIALISATION
 *******************************/
module.exports = function(app, express) {

    // Imports Dependency, models and controllers
	let router = express.Router();
    let UrlPattern = require('url-pattern');
    let url = require('url');
    let RegisterController = require("../controllers/RegisterController");
	let Register = require('../models/Register');
    let ObjectId = require('mongodb').ObjectID;

    // Pattern initialisation used for validation
    let urlPatternOptions = {segmentValueCharset: 'a-zA-Z0-9.-_'};

    // Signup email/password
    router.post('/signup',  (req, res) =>  {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.store();
    });

    // Verify Signup OTP
    router.post('/verifySignupOTP/:id', (req, res) =>  {
        let pattern = new UrlPattern('/api/verifySignupOTP/:id');
        let segments = pattern.match('/api' + req.url);
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.verifyOTP(ObjectId(segments.id));
    });

    // Update Signup Details
    router.post('/updateSignupUserDetail/:id', (req, res) => {
        let pattern = new UrlPattern('/api/updateSignupUserDetail/:id');
        let segments = pattern.match('/api' + req.url);
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.updateSignupDetail(ObjectId(segments.id));
    });

    // Check Username Availability
    router.get('/checkUsername', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.show();
    });

    // Signup with FB
    router.post('/signupfb', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.storeFbUser();
    });

    // Resend OTP
    router.post('/resendOTP', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.resendOTP();
    });

    // Forgot Password
    router.post('/recoverPassword', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.recoverPassword();
    });

    // Set Forgot Password
    router.post('/resetPassword', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.resetPassword();
    });

    // Signin
    router.post('/signin', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.signIn();
    });

    // Signout
    router.get('/signout', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.signout();
    });

    // User Details
    router.get('/user', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.show();
    });

    // Signup Mobile
    router.post('/signupMobile', (req, res) => {
        let RegisterObj = (new RegisterController(new Register())).boot(req, res);
        return RegisterObj.storeMobileUser();
    });

	app.use(config.baseApiUrl, router);

};