/****************************
 FOLLOW CONTROLLER
 ****************************/
const Controller = require("./Controller");
const ObjectId = require('mongodb').ObjectID;
const _ = require("lodash");

class FollowController extends Controller{

    constructor(repo) {
        super();
        this.repo = repo;
    }

    // Store Follow details
    async store() {
        let _this = this;

        // Validating the field
        if (!this.req.body.followBy || !this.req.body.followTo) return _this.res.send({status: 0, message: 'Please enter proper details'});

        try {
            // Setting the filter and projection field
            const filter = {followBy: ObjectId(this.req.body.followBy), followTo: ObjectId(this.req.body.followTo)};
            const projection = {_id: 1, followBy: 1, createdOn: 1, followTo: 1};

            // Calling Follow Model
            const follow = await this.repo.findOne(filter, projection);
            if (!_.isEmpty(follow)) throw 'User is already following';

            const followData = {followBy: this.req.body.followBy, followTo: this.req.body.followTo};
            const followNewObject = await this.repo.store(followData);

            _this.res.send({status: 1, message: "User has started following.", data: {follow: followNewObject}});

        } catch (err) {
            console.error("Follow Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Delete Follow details
    async destroy() {
        let _this = this;

        // Validating the field
        if (!this.req.body.followBy || !this.req.body.followTo) return _this.res.send({status: 0, message: 'Please enter proper details'});

        try {
            // Setting the filter and projection field
            const filter = {followBy: ObjectId(this.req.body.followBy), followTo: ObjectId(this.req.body.followTo)};
            const projection = {_id: 1, followBy: 1, createdOn: 1, followTo: 1};

            // Calling Follow Model
            const follow = await this.repo.findOne(filter, projection);
            if (_.isEmpty(follow)) throw 'User is not following';

            const unfollowObject = await this.repo.destroy(filter);

            _this.res.send({status: 1, message: "User has unfollowed."});

        } catch (err) {
            console.error("UnFollow Error", err);
            _this.res.send({status: 0, message: err});
        }
    }

}

module.exports = FollowController;