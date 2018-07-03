/****************************
 MONGOOSE SCHEMAS
 ****************************/
let config = require('./configs');
let mongoose = require('mongoose');

module.exports = function() {
    var db = mongoose.connect(config.db, config.mongoDBOptions).then(
        () => { console.log('MongoDB connected') },
        (err) => { console.log('MongoDB connection error', err) }
    );

    //Load all Schemas
    require('../app/models/AuthenticationSchema');
    require('../app/models/CommentSchema');
    require('../app/models/FollowSchema');
    require('../app/models/PostSchema');
    require('../app/models/RegisterSchema');
    require('../app/models/StoreSchema');
    require('../app/models/RatingSchema');
    require('../app/models/TagSchema');
    require('../app/models/RatingTypeSchema');
    require('../app/models/PlaceTypeSchema');
    require('../app/models/ReportSchema');
    require('../app/models/ReportReasonSchema');
    require('../app/models/FavouriteSchema');
    require('../app/models/NotificationSchema');

    return db;
};
