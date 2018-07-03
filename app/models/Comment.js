/****************************
 COMMENT MODEL
 ****************************/

class Comment {

    constructor(collection) {
        this.collection = collection;
    }

    // Fetch Comment Details
    getComments(filter = {}, project = {}, others = {}) {

        return new Promise((resolve, reject) => {

            let loggedInUserId = (filter.loggedInUserId) ? filter.loggedInUserId : '';
            let blockedUserIds = (filter.blockedUserIds) ? filter.blockedUserIds : [];
            if(filter.loggedInUserId || filter.blockedUserIds) {
                delete filter.loggedInUserId;
                delete filter.blockedUserIds;
            }

            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    {
                        $match: filter
                    },

                    // Stage 2
                    {
                        $graphLookup: {
                            from: "comments",
                            startWith: "$reply",
                            connectFromField: "reply",
                            connectToField: "_id",
                            as: "replies",
                        }
                    },

                    // Stage 3
                    {
                        $lookup: {
                            "from" : "users",
                            "localField" : "userId",
                            "foreignField" : "_id",
                            "as" : "user"
                        }
                    },

                    // Stage 4
                    {
                        $unwind: {
                            path : "$user",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 5
                    {
                        $unwind: {
                            path : "$replies",
                            preserveNullAndEmptyArrays : true
                        }
                    },

                    // Stage 6
                    {
                        $lookup: {
                            "from" : "users",
                            "localField" : "replies.userId",
                            "foreignField" : "_id",
                            "as" : "replies.user"
                        }
                    },

                    // Stage 7
                    {
                        $unwind: {
                            path : "$replies.user",
                            preserveNullAndEmptyArrays : true // optional
                        }
                    },

                    // Stage 8
                    {
                        $project: {
                            "_id" : 1,
                            "like" : { $setDifference: [ "$like", blockedUserIds ] },
                            "dislike" : { $setDifference: [ "$dislike", blockedUserIds ] },
                            "userId" : 1,
                            "postId" : 1,
                            "mediaUrl": 1,
                            "comment" :1,
                            "reply" : 1,
                            "createdOn" : 1,
                            "modifiedAt" : 1,
                            "replies" : 1,
                            "user" : 1,
                            "likeByuser": { $cond: { if: { $gte: [  { $indexOfArray: [ "$replies.like", loggedInUserId ] }, 0 ] }, then: true, else: false } },
                            "dislikeByuser": { $cond: { if: { $gte: [  { $indexOfArray: [ "$replies.dislike", loggedInUserId ] }, 0 ] }, then: true, else: false } },
                            "likeCounts": { $cond: { if: { $eq: [  {$type : "$replies.like"}, 'array' ] }, then: {$size: "$replies.like"}, else: 0 } },
                            "dislikeCounts": { $cond: { if: { $eq: [  {$type : "$replies.dislike"}, 'array' ] }, then: {$size: "$replies.dislike"}, else: 0 } },
                        }
                    },

                    // Stage 9
                    {
                        $group: {
                            "_id":'$_id',
                            "doc":{$first:'$$ROOT'},
                            "replies":{$addToSet:{"_id": "$replies._id", "postId": "$replies.postId","userId": "$replies.userId",
                                "comment": "$replies.comment","parentId": "$replies.parentId","mediaUrl": "$replies.mediaUrl",
                                "modifiedOn": "$replies.modifiedOn", "createdOn": "$replies.createdOn", "reply": "$replies.reply",
                                "dislike": { $setDifference: [ "$replies.dislike", blockedUserIds ] },
                                "like": { $setDifference: [ "$replies.like", blockedUserIds ] },"username": "$replies.user.userName",
                                "userfirstName": "$replies.user.firstName",
                                "userlastName": "$replies.user.lastName","userprofileUrl": "$replies.user.profileUrl",
                                "userThumbnailUrl": "$replies.user.profileThumbnailUrl",
                                "likeByuser": "$likeByuser",
                                "dislikeByuser": "$dislikeByuser",
                                "likeCounts": "$likeCounts",
                                "dislikeCounts": "$dislikeCounts"
                            }}
                        }
                    },

                    // Stage 10
                    {
                        $project: {
                            "_id": "$_id",
                            "userId" : "$doc.userId",
                            "postId" : "$doc.postId",
                            "like": "$doc.like",
                            "dislike": "$doc.dislike",
                            "comment" : "$doc.comment",
                            "createdOn" : "$doc.createdOn",
                            // "replies": "$replies",
                            "username": "$doc.user.userName",
                            "userfirstName": "$doc.user.firstName",
                            "userlastName": "$doc.user.lastName",
                            "userprofileUrl": "$doc.user.profileUrl",
                            "userThumbnailUrl": "$doc.user.profileThumbnailUrl",
                            "likeByuser":{$in:[loggedInUserId,'$doc.like']},
                            "dislikeByuser":{$in:[loggedInUserId,'$doc.dislike']},
                            "likeCounts":{$size:'$doc.like'},
                            "dislikeCounts":{$size:'$doc.dislike'},
                            "replies" : {
                                $filter: {
                                    input: "$replies",
                                    as: "reply",
                                    cond: {"$not": { "$in": [ "$$reply.userId", blockedUserIds ] }}
                                }
                            }
                        }
                    },

                    // Stage 11
                    {
                        $project: {
                            "_id": 1,
                            "userId" : 1,
                            "postId" : 1,
                            "like": 1,
                            "dislike": 1,
                            "comment" : 1,
                            "createdOn" : 1,
                            // "replies": "$replies",
                            "username": 1,
                            "userfirstName": 1,
                            "userlastName": 1,
                            "userprofileUrl": 1,
                            "userThumbnailUrl": 1,
                            "likeByuser":1,
                            "dislikeByuser":1,
                            "likeCounts":1,
                            "dislikeCounts":1,
                            "replies" : {
                                $switch:
                                    {
                                        branches: [
                                            {
                                                case: { $eq : [ {$size:'$replies._id'}, 0 ] },
                                                then: []
                                            }

                                        ],
                                        default:'$replies'
                                    }
                            }
                        }
                    },

                    // Stage 12
                    {
                        $sort: {
                            "createdOn" : 1
                        }
                    },

                ], (err, comments) => {
                    if (err) { return reject({message: err, status: 0 }); }

                    return resolve(comments);
                });

        });

    }

}

module.exports = Comment;