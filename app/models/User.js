/****************************
 USER MODEL
 ****************************/
const Users = require('../models/RegisterSchema').Users;
const Follows = require('../models/FollowSchema').Follows;
const Pagination = require('../services/Pagination');

class User {

    constructor(collection) {
        this.collection = collection;
    }

    // Fetch Users Details
    getUsers(filter = {}, project = {}, others = {}) {

        let loggedUserId = ( filter.loggedInUserId ) ? filter.loggedInUserId : "";
        if(filter.loggedInUserId) {
            delete filter.loggedInUserId;
        }

        // console.log(filter, "user filterrr")

        return new Promise((resolve, reject) => {

            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    {
                        $match: filter
                    },

                    // Stage 2
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followBy",
                            "as" : "following"
                        }
                    },

                    // Stage 3
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followTo",
                            "as" : "followers"
                        }
                    },

                    // Stage 4
                    {
                        $lookup: {
                            "from" : "posts",
                            "localField" : "_id",
                            "foreignField" : "userId",
                            "as" : "posts"
                        }
                    },

                    // Stage 5
                    {
                        $lookup: {
                            "from" : "favourites",
                            "localField" : "_id",
                            "foreignField" : "favouritedByUserId",
                            "as" : "favouritePosts"
                        }
                    },

                    // Stage 6
                    {
                        $sort: {
                            createdOn: -1
                        }
                    },

                    // Stage 7
                    {
                        $unwind: {
                            path : "$posts",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 4
                    // {
                    //     $match: {"posts.isDeleted": false}
                    // },


                    // Stage 8
                    {
                        $group: {
                            "_id": '$_id',
                            "posts": {$push:'$posts'},
                            "positivebadgeCount": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$posts.quickeeBadge", true ] },
                                    1,
                                    0
                                ]}
                            },
                            "negativebadgeCount": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$posts.quickeeBadge", false ] },
                                    1,
                                    0
                                ]}
                            },
                            doc:{$first:'$$CURRENT'}
                        }
                    },

                    // Stage 9
                    {
                        $project: {
                            _id: 1,
                            email: "$doc.email",
                            fbId: "$doc.fbId",
                            phoneNo: "$doc.phoneNo",
                            isVerified: "$doc.isVerified",
                            isDeleted: "$doc.isDeleted",
                            status: "$doc.status",
                            firstName: "$doc.firstName",
                            lastName: "$doc.lastName",
                            userName: "$doc.userName",
                            profileUrl: "$doc.profileUrl",
                            profileThumbnailUrl: "$doc.profileThumbnailUrl",
                            physicalAddress: "$doc.physicalAddress",
                            dob: "$doc.dob",
                            // followers: { "$size": "$doc.followers" },
                            // followees: { "$size": "$doc.following" },
                            favouritePostCounts: { "$size": "$doc.favouritePosts" },
                            posts: { "$size": "$posts" },
                            favouriteStoreCounts: "$doc.favouriteStoreCounts",
                            allowNativePhoneAddressBook: "$doc.allowNativePhoneAddressBook",
                            badgeCount: { $sum: [ "$positivebadgeCount", "$negativebadgeCount" ] },
                            // followersArray: "$doc.followers",
                            bio : "$doc.bio",
                            followeesArray: {
                                "$filter": {
                                    "input": "$doc.following",
                                    "as": "followee",
                                    "cond": { "$eq": [ "$$followee.isValid", true ] }
                                }
                            },
                            followersArray: {
                                "$filter": {
                                    "input": "$doc.followers",
                                    "as": "follower",
                                    "cond": { "$eq": [ "$$follower.isValid", true ] }
                                }
                            },
                            // favouritePostCounts : "$doc.favouritePostCounts"
                            // isFollowing: { $cond: { if: { $eq: [{ $arrayElemAt: [ "$doc.followers.followBy", 0 ] }, loggedUserId] }, then: true, else: false } },
                        }
                    },

                    // Stage 10
                    {
                        $unwind: {
                            path : "$followersArray",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 11
                    {
                        $group: {
                            "_id": '$_id',
                            "followersArray": {$addToSet:'$followersArray'},
                            "isFollowing": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$followersArray.followBy", loggedUserId ] },
                                    1,
                                    0
                                ]}
                            },
                            doc:{$first:'$$CURRENT'}
                        }
                    },

                    // Stage 12
                    {
                        $project: {
                            _id: 1,
                            email: "$doc.email",
                            fbId: "$doc.fbId",
                            phoneNo: "$doc.phoneNo",
                            isVerified: "$doc.isVerified",
                            isDeleted: "$doc.isDeleted",
                            status: "$doc.status",
                            firstName: "$doc.firstName",
                            lastName: "$doc.lastName",
                            userName: "$doc.userName",
                            profileUrl: "$doc.profileUrl",
                            profileThumbnailUrl: "$doc.profileThumbnailUrl",
                            physicalAddress: "$doc.physicalAddress",
                            dob: "$doc.dob",
                            // followers: "$doc.followers",
                            // followees: "$doc.followees",
                            favouritePostCounts: "$doc.favouritePostCounts",
                            posts: "$doc.posts",
                            favouriteStoreCounts: "$doc.favouriteStoreCounts",
                            allowNativePhoneAddressBook: "$doc.allowNativePhoneAddressBook",
                            badgeCount: "$doc.badgeCount",
                            followers: "$doc.followers",
                            isFollowing : {
                                $cond: { if: { $eq: [ "$isFollowing", 1 ] }, then: true, else: false }
                            },
                            bio : "$doc.bio",
                            followers: { "$size": "$followersArray" },
                            followees: { "$size": "$doc.followeesArray" },
                            // favouritePostCounts : "$doc.favouritePostCounts",
                        }
                    },

                ], (err, users) => {

                    if (err) { return reject({message: err, status: 0 }); }

                    return resolve(users);
                });

        });

    }

    // Fetch Post Users Details
    getPostUsers(filter = {}, project = {}, others = {}) {

        let loggedUserId = ( filter.loggedInUserId ) ? filter.loggedInUserId : "";
        if(filter.loggedInUserId) {
            delete filter.loggedInUserId;
        }

        // console.log(filter, "user filterrr")

        return new Promise((resolve, reject) => {

            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    {
                        $match: filter
                    },

                    // Stage 2
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followBy",
                            "as" : "following"
                        }
                    },

                    // Stage 3
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followTo",
                            "as" : "followers"
                        }
                    },

                    // Stage 4
                    {
                        $lookup: {
                            "from" : "posts",
                            "localField" : "_id",
                            "foreignField" : "userId",
                            "as" : "posts"
                        }
                    },

                    // Stage 5
                    {
                        $lookup: {
                            "from" : "favourites",
                            "localField" : "_id",
                            "foreignField" : "favouritedByUserId",
                            "as" : "favouritePosts"
                        }
                    },

                    // Stage 9
                    {
                        $project: {
                            _id: 1,
                            email: 1,
                            fbId: 1,
                            phoneNo: 1,
                            isVerified: 1,
                            isDeleted: 1,
                            status: 1,
                            firstName: 1,
                            lastName: 1,
                            userName: 1,
                            profileUrl: 1,
                            profileThumbnailUrl: 1,
                            physicalAddress: 1,
                            dob: 1,
                            following: 1,
                            followers: 1,
                            favouritePosts: 1,
                            posts: {
                                "$filter": {
                                    "input": "$posts",
                                    "as": "post",
                                    "cond": { "$eq": [ "$$post.isDeleted", false ] }
                                }
                            },
                            favouriteStoreCounts: 1,
                            allowNativePhoneAddressBook: 1,
                            bio : 1,
                        }
                    },

                    // Stage 6
                    {
                        $sort: {
                            createdOn: -1
                        }
                    },

                    // Stage 7
                    {
                        $unwind: {
                            path : "$posts",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 4
                    // {
                    //     $match: {"posts.isDeleted": false}
                    // },


                    // Stage 8
                    {
                        $group: {
                            "_id": '$_id',
                            "posts": {$push:'$posts'},
                            "positivebadgeCount": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$posts.quickeeBadge", true ] },
                                    1,
                                    0
                                ]}
                            },
                            "negativebadgeCount": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$posts.quickeeBadge", false ] },
                                    1,
                                    0
                                ]}
                            },
                            doc:{$first:'$$CURRENT'}
                        }
                    },

                    // Stage 9
                    {
                        $project: {
                            _id: 1,
                            email: "$doc.email",
                            fbId: "$doc.fbId",
                            phoneNo: "$doc.phoneNo",
                            isVerified: "$doc.isVerified",
                            isDeleted: "$doc.isDeleted",
                            status: "$doc.status",
                            firstName: "$doc.firstName",
                            lastName: "$doc.lastName",
                            userName: "$doc.userName",
                            profileUrl: "$doc.profileUrl",
                            profileThumbnailUrl: "$doc.profileThumbnailUrl",
                            physicalAddress: "$doc.physicalAddress",
                            dob: "$doc.dob",
                            // followers: { "$size": "$doc.followers" },
                            // followees: { "$size": "$doc.following" },
                            favouritePostCounts: { "$size": "$doc.favouritePosts" },
                            posts: { "$size": "$posts" },
                            favouriteStoreCounts: "$doc.favouriteStoreCounts",
                            allowNativePhoneAddressBook: "$doc.allowNativePhoneAddressBook",
                            badgeCount: { $sum: [ "$positivebadgeCount", "$negativebadgeCount" ] },
                            // followersArray: "$doc.followers",
                            bio : "$doc.bio",
                            followeesArray: {
                                "$filter": {
                                    "input": "$doc.following",
                                    "as": "followee",
                                    "cond": { "$eq": [ "$$followee.isValid", true ] }
                                }
                            },
                            followersArray: {
                                "$filter": {
                                    "input": "$doc.followers",
                                    "as": "follower",
                                    "cond": { "$eq": [ "$$follower.isValid", true ] }
                                }
                            },
                            // favouritePostCounts : "$doc.favouritePostCounts"
                            // isFollowing: { $cond: { if: { $eq: [{ $arrayElemAt: [ "$doc.followers.followBy", 0 ] }, loggedUserId] }, then: true, else: false } },
                        }
                    },

                    // Stage 10
                    {
                        $unwind: {
                            path : "$followersArray",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 11
                    {
                        $group: {
                            "_id": '$_id',
                            "followersArray": {$addToSet:'$followersArray'},
                            "isFollowing": {
                                "$sum": { "$cond": [
                                    { "$eq": [ "$followersArray.followBy", loggedUserId ] },
                                    1,
                                    0
                                ]}
                            },
                            doc:{$first:'$$CURRENT'}
                        }
                    },

                    // Stage 12
                    {
                        $project: {
                            _id: 1,
                            email: "$doc.email",
                            fbId: "$doc.fbId",
                            phoneNo: "$doc.phoneNo",
                            isVerified: "$doc.isVerified",
                            isDeleted: "$doc.isDeleted",
                            status: "$doc.status",
                            firstName: "$doc.firstName",
                            lastName: "$doc.lastName",
                            userName: "$doc.userName",
                            profileUrl: "$doc.profileUrl",
                            profileThumbnailUrl: "$doc.profileThumbnailUrl",
                            physicalAddress: "$doc.physicalAddress",
                            dob: "$doc.dob",
                            // followers: "$doc.followers",
                            // followees: "$doc.followees",
                            favouritePostCounts: "$doc.favouritePostCounts",
                            posts: "$doc.posts",
                            favouriteStoreCounts: "$doc.favouriteStoreCounts",
                            allowNativePhoneAddressBook: "$doc.allowNativePhoneAddressBook",
                            badgeCount: "$doc.badgeCount",
                            followers: "$doc.followers",
                            isFollowing : {
                                $cond: { if: { $eq: [ "$isFollowing", 1 ] }, then: true, else: false }
                            },
                            bio : "$doc.bio",
                            followers: { "$size": "$followersArray" },
                            followees: { "$size": "$doc.followeesArray" },
                            // favouritePostCounts : "$doc.favouritePostCounts",
                        }
                    },

                ], (err, users) => {

                    if (err) { return reject({message: err, status: 0 }); }

                    return resolve(users);
                });

        });

    }

    // Fetch Users Friends
    getUserFriends(filter = {}, userId = '') {

        return new Promise((resolve, reject) => {

            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    {
                        $match: filter
                    },

                    // Stage 2
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followTo",
                            "as" : "followers"
                        }
                    },

                    // Stage 3
                    {
                        $project: {
                            email: 1,
                            fbId: 1,
                            phoneNo: 1,
                            isVerified: 1,
                            status: 1,
                            firstName: 1,
                            lastName: 1,
                            userName: 1,
                            profileUrl: 1,
                            profileThumbnailUrl: 1,
                            physicalAddress: 1,
                            isFollowing: { $cond: { if: { $eq: [{ $arrayElemAt: [ "$followers.followBy", 0 ] }, userId] }, then: true, else: false } },
                            allowNativePhoneAddressBook: 1,
                            createdOn: 1,
                            modifiedOn: 1,
                        }
                    },

                ], (err, users) => {
                    if (err) { return reject({message: err, status: 0 }); }

                    return resolve(users);
                });

        });

    }

    // Fetch LIKE/DISLIKE Users
    getVotesList(filter = {}, userId = '', group = {}) {

        return new Promise(async (resolve, reject) => {

            let query = {filter, group};

            let stages = [
                    // Stage 1
                    {
                        $match: filter
                    },

                    // Stage 2
                    {
                        $lookup: {
                            "from" : "follows",
                            "localField" : "_id",
                            "foreignField" : "followTo",
                            "as" : "followers"
                        }
                    },

                    // Stage 3
                    {
                        $project: {
                            email: 1,
                            fbId: 1,
                            phoneNo: 1,
                            isVerified: 1,
                            status: 1,
                            firstName: 1,
                            lastName: 1,
                            userName: 1,
                            profileUrl: 1,
                            profileThumbnailUrl: 1,
                            physicalAddress: 1,
                            // isFollowing: { $cond: { if: { $eq: [{ $arrayElemAt: [ "$followers.followBy", 0 ] }, userId] }, then: true, else: false } },
                            isFollowing: { $cond: { if: { $gte: [  { $indexOfArray: [ "$followers.followBy", userId ] }, 0 ] } , then: true, else: false } },
                            // isFollowing: { $cond:[{$and:[ { "$eq": [ "$followers.isValid", true ] },{ if: { $gte: [  { $indexOfArray: [ "$followers.followBy", userId ] }, 0 ] } , then: true, else: false }]}] },
                            allowNativePhoneAddressBook: 1,
                            createdOn: 1,
                            modifiedOn: 1,
                        }
                    },

                ];

            try {

                let paginateObject = new Pagination(query,Users);
                const userList = await paginateObject.paginate(stages, true)

                return resolve(userList);

            } catch (err) {
                console.log("Like, Dislike model aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });

    }

    // Fetch Following Users
    getFollowing(filter = {}, userId = '', group = {}) {

        return new Promise(async (resolve, reject) => {

            let query = {filter, group};

            let stages = [
                // Stage 1
                {
                    $match: {
                        "followBy":userId,
                        "isValid":true
                    }
                },

                // Stage 2
                {
                    $lookup: // Equality Match
                        {
                            from: "users",
                            localField: "followTo",
                            foreignField: "_id",
                            as: "user"
                        }
                },

                // Stage 3
                {
                    $unwind: {
                        path : "$user"
                    }
                },

                // Stage 4
                {
                    $project: {
                        "_id" : "$user._id",
                        "phoneNo" : "$user.phoneNo",
                        "fbId" : "$user.fbId",
                        "email" : "$user.email",
                        "profileThumbnailUrl" : "$user.profileThumbnailUrl",
                        "profileUrl" : "$user.profileUrl",
                        "userName" : "$user.userName",
                        "lastName" : "$user.lastName",
                        "firstName" : "$user.firstName",
                        "modifiedOn": "$user.modifiedOn",
                        "createdOn": "$user.createdOn",
                        "allowNativePhoneAddressBook": "$user.allowNativePhoneAddressBook",
                        "status": "$user.status",
                        "isVerified": "$user.isVerified",
                        "isFollowing": { $literal: true },
                    }
                },
            ]



            // let stages = // Pipeline
            //     [
            //         // Stage 1
            //         {
            //             $match: filter
            //         },
            //
            //         // Stage 2
            //         {
            //             $lookup: {
            //                 "from" : "follows",
            //                 "localField" : "_id",
            //                 "foreignField" : "followTo",
            //                 "as" : "follow"
            //             }
            //         },
            //
            //         // Stage 3
            //         {
            //             $redact: {
            //                 // $cond: { if: { $gte: [  { $indexOfArray: [ "$follow.followBy", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }
            //                 $cond: { if: { $gte: [  { $indexOfArray: [ "$follow.followBy", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }
            //                 // $cond:[{$and:[ { "$eq": [ "$follow.isValid", true ] },{ if: { $gte: [  { $indexOfArray: [ "$follow.followBy", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }]}]
            //             }
            //         },
            //
            //         // Stage 4
            //         {
            //             $project: {
            //                 "_id" : 1,
            //                 "phoneNo" : 1,
            //                 "fbId" : 1,
            //                 "email" : 1,
            //                 "profileThumbnailUrl" : 1,
            //                 "profileUrl" : 1,
            //                 "userName" : 1,
            //                 "lastName" : 1,
            //                 "firstName" : 1,
            //                 "modifiedOn": 1,
            //                 "createdOn": 1,
            //                 "allowNativePhoneAddressBook": 1,
            //                 "status": 1,
            //                 "isVerified": 1,
            //                 "isFollowing": { $literal: true },
            //             }
            //         },
            //
            //     ];

            try {

                let paginateObject = new Pagination(query,Follows);
                const following = await paginateObject.paginate(stages, true)

                return resolve(following);

            } catch (err) {
                console.log("Following model aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });

    }

    // Fetch Followers Users
    getFollowers(filter = {}, userId = '', group = {}) {

        return new Promise(async (resolve, reject) => {

            let query = {filter, group};

            let stages = [
                // Stage 1
                {
                    $match: {
                        "followTo":userId,
                        "isValid":true
                    }
                },

                // Stage 2
                {
                    $lookup: // Equality Match
                        {
                            from: "users",
                            localField: "followBy",
                            foreignField: "_id",
                            as: "user"
                        }
                },

                // Stage 3
                {
                    $unwind: {
                        path : "$user"
                    }
                },

                // Stage 4
                {
                    $project: {
                        "_id" : "$user._id",
                        "phoneNo" : "$user.phoneNo",
                        "fbId" : "$user.fbId",
                        "email" : "$user.email",
                        "profileThumbnailUrl" : "$user.profileThumbnailUrl",
                        "profileUrl" : "$user.profileUrl",
                        "userName" : "$user.userName",
                        "lastName" : "$user.lastName",
                        "firstName" : "$user.firstName",
                        "modifiedOn": "$user.modifiedOn",
                        "createdOn": "$user.createdOn",
                        "allowNativePhoneAddressBook": "$user.allowNativePhoneAddressBook",
                        "status": "$user.status",
                        "isVerified": "$user.isVerified",
                        // "isFollowing": { $literal: true }
                        // if: { $eq: [{ $arrayElemAt: [ "$followers.followBy", 0 ] }, userId] }, then: true, else: false }
                        // "isFollowing": { $cond:{if: { $eq: [{ $indexOfArray: [ "$followBy", userId ] }, 0] }, then: true, else: false }}
                    },
                },

                // Stage 2
                {
                    $lookup: // Equality Match
                        {
                            from: "follows",
                            localField: "_id",
                            foreignField: "followTo",
                            as: "following"
                        }
                },

                // Stage 4
                {
                    $project: {
                        "_id" : 1,
                        "phoneNo" : 1,
                        "fbId" : 1,
                        "email" : 1,
                        "profileThumbnailUrl" : 1,
                        "profileUrl" : 1,
                        "userName" : 1,
                        "lastName" : 1,
                        "firstName" : 1,
                        "modifiedOn": 1,
                        "createdOn": 1,
                        "allowNativePhoneAddressBook": 1,
                        "status": 1,
                        "isVerified": 1,
                        "isFollowing": { $and: [ { $cond: { if: { $gte: [  { $indexOfArray: [ "$following.isValid", true  ] }, 0 ] } , then: true, else: false } }, { $cond: { if: { $gte: [  { $indexOfArray: [ "$following.followBy", userId  ] }, 0 ] } , then: true, else: false } }] }

                        // "isFollowing": { $cond:{if: {$and: [{ $eq: [{ $indexOfArray: [ "$following.isValid", true ] }, 0] }, { $eq: [{ $indexOfArray: [ "$following.followBy", userId ] }, 0] }]}, then: true, else: false }}
                        // if: { $eq: [{ $arrayElemAt: [ "$followers.followBy", 0 ] }, userId] }, then: true, else: false }
                        // "isFollowing": { $cond:{if: { $eq: [{ $indexOfArray: [ "$followBy", userId ] }, 0] }, then: true, else: false }}
                    },
                },
            ]

            // let stages = [
            //     // Stage 1
            //     {
            //         $match: filter
            //     },
            //
            //     // Stage 2
            //     {
            //         $lookup: {
            //             "from" : "follows",
            //             "localField" : "_id",
            //             "foreignField" : "followBy",
            //             "as" : "follow"
            //         }
            //     },
            //
            //     // Stage 3
            //     {
            //         $redact: {
            //             // $cond: { if: { $gte: [  { $indexOfArray: [ "$follow.followTo", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }
            //             $cond: { if: { $gte: [  { $indexOfArray: [ "$follow.followTo", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }
            //             // $cond:[{$and:[ { "$eq": [ "$follow.isValid", true ] },{ if: { $gte: [  { $indexOfArray: [ "$follow.followTo", userId ] }, 0 ] }, then: "$$DESCEND", else: "$$PRUNE" }]}]
            //         }
            //     },
            //
            //     // Stage 4
            //     {
            //         $project: {
            //             "_id" : 1,
            //             "phoneNo" : 1,
            //             "fbId" : 1,
            //             "email" : 1,
            //             "profileThumbnailUrl" : 1,
            //             "profileUrl" : 1,
            //             "userName" : 1,
            //             "lastName" : 1,
            //             "firstName" : 1,
            //             "modifiedOn": 1,
            //             "createdOn": 1,
            //             "allowNativePhoneAddressBook": 1,
            //             "status": 1,
            //             "isVerified": 1,
            //             "isFollowing": { $literal: true },
            //         }
            //     },
            //
            // ];

            try {

                let paginateObject = new Pagination(query,Follows);
                const followers = await paginateObject.paginate(stages, true)

                return resolve(followers);

            } catch (err) {
                console.log("Followers model aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });

    }

}

module.exports = User;
