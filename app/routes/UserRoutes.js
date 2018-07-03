/*******************************
 USER ROUTING INITIALISATION
 *******************************/
module.exports = function(app, express) {

    // Imports Dependency, models and controllers
	const router = express.Router();
    const UserController = require("../controllers/UserController");
    const Model = require("../models/Model");
    const Globals = require("../../configs/Globals");
    const User = require("../models/User");
    const Users = require("../models/RegisterSchema").Users;
    const Blocks = require("../models/BlockSchema").Blocks;
    const ObjectId = require('mongodb').ObjectID;
    let UrlPattern = require('url-pattern');
    let url = require('url');

    // Pattern initialisation used for validation
    let urlPatternOptions = {segmentValueCharset: 'a-zA-Z0-9.-_'};

    // Users Listing
    router.get('/users', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new User(Users))).boot(req, res);
        return UserObj.collection();
    });

    // Users List
    router.post('/usersDetails', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new Model(Users))).boot(req, res);
        return UserObj.usersDetails();
    });

    // Dashboard Count
    router.get('/dashboardUsersCount', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new User(Users))).boot(req, res);
        return UserObj.dashboardCount();
    });

    // Find Friend
    router.post('/findFriends/:id', Globals.isAuthorised, (req, res, next) => {
        const pattern = new UrlPattern('/api/findFriends/:id');
        const segments = pattern.match('/api' + req.url);
        const UserObj = (new UserController(new User(Users))).boot(req, res);
        return UserObj.findFriends(ObjectId(segments.id));
    });

    // Delete User
    router.post('/deleteUser/:id', Globals.isAuthorised, (req, res, next) => {
        const pattern = new UrlPattern('/api/deleteUser/:id');
        const segments = pattern.match('/api' + req.url);
        const UserObj = (new UserController(new Model(Users))).boot(req, res);
        return UserObj.update(ObjectId(segments.id));
    });

    // Search People
    router.get('/searchPeople', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new User(Users))).boot(req, res);
        return UserObj.searchPeople();
    });

    // Change Password
    router.post('/changePassword', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new Model(Users))).boot(req, res);
        return UserObj.changePassword();
    });

    // Update User Profile
    router.post('/userProfile/:id/update', (req, res) => {
        let pattern = new UrlPattern('/api/userProfile/:id/update', urlPatternOptions);
        let segments = pattern.match('/api' + req.url);
        let UserObj = (new UserController(new Model(Users))).boot(req, res);
        return UserObj.updateProfile(ObjectId(segments.id));
    });

    // Users List with details
    router.get('/userList', Globals.isAuthorised, (req, res, next) => {
        const UserObj = (new UserController(new User(Users))).boot(req, res);
        return UserObj.userListCollection();
    });

    // Block an user
    router.post('/block-user', Globals.isAuthorised, (req, res, next) =>  {
        const UserObj = (new UserController(new Model(Blocks))).boot(req, res);
        return UserObj.block();
    });

	app.use(config.baseApiUrl, router);

};