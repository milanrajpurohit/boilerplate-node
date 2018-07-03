/****************************
 FAVOURITE CONTROLLER
 ****************************/
const Controller = require("./Controller");
const ObjectId = require('mongodb').ObjectID;
const Model = require('../models/Model');
const Favourites = require('../models/FavouriteSchema').Favourites;
const Blocks = require('../models/BlockSchema').Blocks;
const _ = require("lodash");

class FavouriteController extends Controller{

    constructor(repo) {
        super();
        this.repo = repo;
    }

    // Get Favourites Quickee
    async collection() {
        let _this = this;

        try {
            // Setting the filter and group field
            let filter = {loggedInUserId: ObjectId(this.req.query.loggedInUserId)};

            let group = {"sortBy": "createdOn", "order": "desc"};
            (this.req.query.page) ? (group.page = this.req.query.page) : delete group.page;

            const paginate = (this.req.query.page) ? true : false;

            // Calling Block Model to find blocked user
            let blockedIds = await (new Model(Blocks)).find({"blockedByUserId": ObjectId(this.req.query.loggedInUserId)}, {"blockedToUserId": 1});

            let blockedUserIds = [];
            blockedIds.filter((id) => {
                blockedUserIds.push(ObjectId(id.blockedToUserId));
            })
            filter.blockedUserIds = blockedUserIds;
            filter.userId = {$nin: blockedUserIds};

            // Calling Model
            let favouritesQuickees = await this.repo.getFavourites(filter, group, paginate);
            if (!favouritesQuickees.data.length) return _this.res.send({status: 1, message: 'Favourites Quickees are not found', data: []});

            return _this.res.send({status: 1, message: "Favourite Quickees found successfully.", data: favouritesQuickees});

        } catch(err) {
            console.log("List of Favourite quickees", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // FAVOURITE OR UNFAVOURITE QUICKEE
    async store() {
        let _this = this;

        // Validating the field
        if (!this.req.body.userId || !this.req.body.postId) return _this.res.send({status: 0, message: 'Please send proper data.'});

        try {
            // Setting the filter and projection field
            const filter = {favouritedByUserId: ObjectId(this.req.body.userId), postId: ObjectId(this.req.body.postId)};
            const projection = {_id: 1, userId: 1, createdOn: 1, postId: 1};

            // Calling Favourite Model
            const favouriteQuickee = await this.repo.findOne(filter, projection);

            // In case of unfavourite the quickee
            if(this.req.body.action == 'unfavourite') {

                // Calling Favourite Model
                if (_.isEmpty(favouriteQuickee)) throw 'Quickee is not favourited.';
                const unfavouriteObject = await (new Model(Favourites)).destroy(filter);

                return _this.res.send({status: 1, message: "Quickee has unfavourited."});
            }

            if (!_.isEmpty(favouriteQuickee)) throw 'Quickee is already favourited.';

            const favouriteQuickeeNewObject = await this.repo.store(filter);

            return _this.res.send({status: 1, message: "Quickee is Favourited successfully.", data: favouriteQuickeeNewObject});

        } catch (err) {
            console.error("Quickee favourite Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

}

module.exports = FavouriteController;