/*******************************
 COMMENT ROUTING INITIALISATION
 *******************************/
 module.exports = function(app, express) {

    // Imports Dependency, models and controllers
    const router = express.Router();
    const CommentController = require("../controllers/CommentController");
    const Comment = require('../models/Comment');
    const Posts = require("../models/PostSchema").Posts;
    const Model = require("../models/Model");
    const Comments = require("../models/CommentSchema").Comments;
    const Globals = require("../../configs/Globals");
    const Notifications = require("../models/NotificationSchema").Notifications;
    // Get comment
    router.get('/comments', Globals.isAuthorised, (req, res, next) => {
        const CommentObj = (new CommentController(new Comment(Comments), new Model(Posts))).boot(req, res);
        return CommentObj.collection();
    });

    // Save comment
    router.post('/comment', Globals.isAuthorised, (req, res, next) => {
        const CommentObj = (new CommentController(new Model(Comments), new Model(Posts),new Model(Notifications))).boot(req, res);
        return CommentObj.store();
    });

    app.use(config.baseApiUrl, router);

};