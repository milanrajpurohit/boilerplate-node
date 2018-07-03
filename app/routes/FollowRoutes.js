/*******************************
 FOLLOW ROUTING INITIALISATION
 *******************************/
module.exports = function(app, express) {

    // Imports Dependency, models and controllers
	const router = express.Router();
    const FollowController = require("../controllers/FollowController");
    const Model = require("../models/Model");
    const Follows = require("../models/FollowSchema").Follows;
    const Globals = require("../../configs/Globals");

    // Store Follow Details
    router.post('/follow', Globals.isAuthorised, (req, res, next) =>  {
        const FollowObj = (new FollowController(new Model(Follows))).boot(req, res);
        return FollowObj.store();
    });

    // Delete Follow Details
    router.post('/unfollow', Globals.isAuthorised, (req, res, next) =>  {
        const FollowObj = (new FollowController(new Model(Follows))).boot(req, res);
        return FollowObj.destroy();
    });

	app.use(config.baseApiUrl, router);

};