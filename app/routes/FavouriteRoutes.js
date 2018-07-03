/*******************************
 FAVOURITE ROUTING INITIALISATION
 *******************************/
module.exports = function(app, express) {

    // Imports Dependency, models and controllers
    const router = express.Router();
    const FavouriteController = require("../controllers/FavouriteController");
    const Model = require('../models/Model');
    const Favourite = require('../models/Favourite');
    const Favourites = require('../models/FavouriteSchema').Favourites;
    const Globals = require("../../configs/Globals");

    // Save Favourite Quickee
    router.post('/favourite', Globals.isAuthorised, (req, res, next) =>  {
        const FavouriteObj = (new FavouriteController(new Model(Favourites))).boot(req, res);
        return FavouriteObj.store();
    });

    // Get List of Favourite Quickees
    router.get('/favourites', Globals.isAuthorised, (req, res, next) => {
        const FavouriteObj = (new FavouriteController(new Favourite(Favourites))).boot(req, res);
        return FavouriteObj.collection();
    });

    app.use(config.baseApiUrl, router);

};