/****************************
 POST MODEL
 ****************************/
const config = require('../../configs/configs');
const Pagination = require('../services/Pagination');
const Posts = require("../models/PostSchema").Posts;
const Model = require("../models/Model");
const _ = require("lodash");

class Favourite {

    constructor(collection) {
        this.collection = collection;
    }

    // List of favourite Quickees
    getFavourites(filter = {}, group = {}, paginate = true) {

        return new Promise(async (resolve, reject) => {

            filter.isDeleted = false;
            let query = {filter, group};
            let loggedInUserId = ( filter.loggedInUserId ) ? filter.loggedInUserId : filter.userId;
            let blockedUserIds = ( filter.blockedUserIds ) ? filter.blockedUserIds : [];
            if(filter.loggedInUserId) {
                delete filter.loggedInUserId;
                delete filter.blockedUserIds;
            }

            let stages = [
                // Stage 1
                {
                    $match: filter
                },

                // // Stage 2
                // {
                //     $lookup: {
                //         "from" : "blocks",
                //         "localField" : "userId",
                //         "foreignField" : "blockedToUserId",
                //         "as" : "block"
                //     }
                // },
                //
                // // Stage 3
                // {
                //     $redact: {
                //         $cond: {
                //             if: { $eq: [ { $arrayElemAt: [ "$block.blockedByUserId", 0 ] }, loggedInUserId ] },
                //             then: "$$PRUNE",
                //             else: "$$DESCEND"
                //         }
                //     }
                // },

                // Stage 2
                {
                    $lookup: {
                        "from" : "favourites",
                        "localField" : "_id",
                        "foreignField" : "postId",
                        "as" : "favourites"
                    }
                },

                // Stage 3
                {
                    $redact: {
                        $cond: { if: { $gte: [  { $indexOfArray: [ "$favourites.favouritedByUserId", loggedInUserId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }
                    }
                },

                // Stage 4
                {
                    $lookup: {
                        "from" : "users",
                        "localField" : "userId",
                        "foreignField" : "_id",
                        "as" : "user"
                    }
                },

                // Stage 5
                {
                    $lookup: {
                        "from" : "stores",
                        "localField" : "storeId",
                        "foreignField" : "_id",
                        "as" : "store"
                    }
                },

                // Stage 6
                {
                    $lookup: {
                        "from" : "comments",
                        "localField" : "_id",
                        "foreignField" : "postId",
                        "as" : "comments"
                    }
                },

                // Stage 7
                {
                    $project: {
                        "_id": 1,
                        "quickeeHeadline": 1,
                        "quickeeDescription": 1,
                        "quickeeMediaType": 1,
                        "quickeeMediaWidth": 1,
                        "quickeeMediaHeight": 1,
                        "quickeeRecommend": 1,
                        "quickeeBadge": 1,
                        "quickeeMediaUrl": 1,
                        "quickeeVideoFrameUrl": 1,
                        "quickeeAvgRating": 1,
                        "userId": 1,
                        "storeId": 1,
                        "like" : { $setDifference: [ "$like", blockedUserIds ] },
                        "dislike" : { $setDifference: [ "$dislike", blockedUserIds ] },
                        "quickeeType" : 1,
                        "tags" : 1,
                        "userFirstName" : { $arrayElemAt: [ "$user.firstName", 0 ] },
                        "userFirstName" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.firstName", 0 ] }, else: "Anonymously" }
                        },
                        "userLastName" : { $arrayElemAt: [ "$user.lastName", 0 ] },
                        "userLastName" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.lastName", 0 ] }, else: "" }
                        },
                        "userName" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.userName", 0 ] }, else: "Anonymously" }
                        },
                        "userProfileUrl" : { $arrayElemAt: [ "$user.profileUrl", 0 ] },
                        "userProfileUrl" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.profileUrl", 0 ] }, else: config.apiUrl + "/public/uploads/anonymous.png" }
                        },
                        "userProfileThumbnailUrl" : { $arrayElemAt: [ "$user.profileThumbnailUrl", 0 ] },
                        "userProfileThumbnailUrl" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.profileThumbnailUrl", 0 ] }, else: config.apiUrl + "/public/uploads/anonymous.png" }
                        },
                        "userPhysicalAddress" : { $arrayElemAt: [ "$user.physicalAddress", 0 ] },
                        "userPhysicalAddress" : {
                            $cond: { if: { $eq: [ "$quickeeType", "username" ] }, then: { $arrayElemAt: [ "$user.physicalAddress", 0 ] }, else: "Anonymously" }
                        },
                        "tagCounts" : 1,
                        "comments": {
                            $filter: {
                                input: "$comments",
                                as: "comment",
                                cond: {"$not": { "$in": [ "$$comment.userId", blockedUserIds ] }}
                            }
                        },
                        // "commentCounts" : { "$size": "$comments" },
                        "likeCounts" : { "$size": "$like" },
                        "dislikeCounts" : { "$size": "$dislike" },
                        "avgRatings" : 1,
                        "allowCommenting" : 1,
                        "storeAddress" : { $arrayElemAt: [ "$store.storeAddress", 0 ] },
                        "place" : { $arrayElemAt: [ "$store.storeName", 0 ] },
                        "storeLattitude" : { $arrayElemAt: [ "$store.storeLattitude", 0 ] },
                        "storeLongitude" : { $arrayElemAt: [ "$store.storeLongitude", 0 ] },
                        "storePlaceType" : { $arrayElemAt: [ "$store.storeType", 0 ] },
                        "createdOn" : 1,
                        "modifiedAt" : 1,
                        "isFavourite": { $literal: true },
                        "likeByuser": { $cond: { if: { $gte: [  { $indexOfArray: [ "$like", loggedInUserId ] }, 0 ] }, then: true, else: false } },
                        "dislikeByuser": { $cond: { if: { $gte: [  { $indexOfArray: [ "$dislike", loggedInUserId ] }, 0 ] }, then: true, else: false } }
                    }
                },

                // Stage 8
                {
                    $project: {
                        "_id": 1,
                        "quickeeHeadline": 1,
                        "quickeeDescription": 1,
                        "quickeeMediaType": 1,
                        "quickeeMediaWidth": 1,
                        "quickeeMediaHeight": 1,
                        "quickeeRecommend": 1,
                        "quickeeBadge": 1,
                        "quickeeMediaUrl": 1,
                        "quickeeVideoFrameUrl": 1,
                        "quickeeAvgRating": 1,
                        "userId": 1,
                        "storeId": 1,
                        "like" : 1,
                        "dislike" : 1,
                        "quickeeType" : 1,
                        "tags" : 1,
                        "userFirstName" : 1,
                        "userFirstName" : 1,
                        "userLastName" : 1,
                        "userLastName" : 1,
                        "userName" : 1,
                        "userProfileUrl" : 1,
                        "userProfileUrl" : 1,
                        "userProfileThumbnailUrl" : 1,
                        "userProfileThumbnailUrl" : 1,
                        "userPhysicalAddress" : 1,
                        "userPhysicalAddress" : 1,
                        "tagCounts" : 1,
                        "commentCounts" : { "$size": "$comments" },
                        "likeCounts" : 1,
                        "dislikeCounts" : 1,
                        "avgRatings" : 1,
                        "allowCommenting" : 1,
                        "storeAddress" : 1,
                        "place" : 1,
                        "storeLattitude" : 1,
                        "storeLongitude" : 1,
                        "storePlaceType" : 1,
                        "createdOn" : 1,
                        "modifiedAt" : 1,
                        "isFavourite": 1,
                        "likeByuser": 1,
                        "dislikeByuser": 1
                    }
                },

            ];

            try {

                if (!paginate) {
                    // For all results
                    let favouriteObject = new Model(Posts);
                    const favouriteQuickees = await favouriteObject.aggregate(stages, query.group)

                    return resolve(favouriteQuickees);

                } else {

                    let paginateObject = new Pagination(query,Posts);
                    const favouriteQuickees = await paginateObject.paginate(stages, paginate)

                    return resolve(favouriteQuickees);

                }

            } catch (err) {
                console.log("Favourite Quickees aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });

    }

}

module.exports = Favourite;