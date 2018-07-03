/****************************
 COMMENT CONTROLLER
 ****************************/
const Controller = require("./Controller");
const ObjectId = require('mongodb').ObjectID;
const Comments = require("../models/CommentSchema").Comments;
const Comment = require("../models/Comment");
const Model = require("../models/Model");
const Users = require("../models/RegisterSchema").Users;
const Blocks = require("../models/BlockSchema").Blocks;
const config = require('../../configs/configs');
const Form = require("../services/Form");
const File = require("../services/File");
const Post = require("../models/Post");
const Posts = require("../models/PostSchema").Posts;
const _ = require("lodash");
const Notifications = require("../models/NotificationSchema").Notifications;
const PushNotification = require("../services/PushNotification");

class CommentController extends Controller{

    constructor(repo, postRepo, notificationRepo) {
        super();
        this.repo = repo;
        this.postRepo = postRepo;
        this.notificationRepo = notificationRepo;
    }

    // To get Comments of post
    async collection() {
        let _this = this;

        // Validating field
        if(!this.req.query.postId) return _this.res.send({status: 0, message: 'Bad request. Invalid PostId'});

        try {
            // Setting filter
            let filter = {postId: ObjectId(this.req.query.postId), parentId: { $exists: false }};
            (this.req.query.loggedInUserId) ? filter.loggedInUserId = ObjectId(this.req.query.loggedInUserId) : delete filter.loggedInUserId;

            // Calling Block Model to find blocked user
            let blockedIds = await (new Model(Blocks)).find({"blockedByUserId": ObjectId(this.req.query.loggedInUserId)}, {"blockedToUserId": 1});

            let blockedUserIds = [];
            blockedIds.filter((id) => {
                blockedUserIds.push(ObjectId(id.blockedToUserId));
            })
            filter.blockedUserIds = blockedUserIds;
            filter.userId = {$nin: blockedUserIds};

            // Calling Comment Model
            const comments = await this.repo.getComments(filter, {}, {});
            if (!comments) return _this.res.send({status: 1, message: "Comments are not found", data: []});

            // const post = await this.postRepo.findOne({_id: ObjectId(this.req.query.postId), isDeleted: false}, {});
            // if (!post) { return _this.res.send({status: 0, message: "Post is not found", data: {}}); }

            // change post data
            const posts = await (new Post(Posts)).getPosts({_id: ObjectId(this.req.query.postId),
                isDeleted: false, loggedInUserId: ObjectId(this.req.query.loggedInUserId)},
                {"sortBy": "createdOn", "order": "desc"}, false);
            console.log("posts  =", posts['data'][0]);
            if (!posts) { return _this.res.send({status: 0, message: "Post is not found", data: {}}); }


            let commentObject = {post: posts['data'][0], comments};
            _this.res.send({status: 1, message: "Comments found successfully", data: commentObject});


        } catch (err) {
            console.error("Comment Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Store comment
    async store() {
        let _this = this;

        try {
            let parentComment = {};
            let fileObject = {};

            const form = new Form(this.req);
            const formObject = await form.parse();

            if(!_.isEmpty(formObject.files)) {
                const file = new File(formObject.files);
                fileObject = await file.store();
            }

            // Validating field
            if(!formObject.fields.postId || !formObject.fields.userId) return _this.res.send({status: 0, message: 'Bad request. Please send PostId and UserId both.'});

            // Validating post whether correct or not
            const post = await this.postRepo.findOne({_id: ObjectId(formObject.fields.postId[0]), isDeleted: false}, {});
            if (!post) throw "Invalid Post."

            // Validating the parent comment exist or not
        if(formObject.fields.parentId) {
            parentComment = await this.repo.findOne({_id: ObjectId(formObject.fields.parentId[0])}, {});
            if (!parentComment) throw "Invalid Parent Comment."
        }

            // Setting Comment Data
            const commentData = {};
            (formObject.fields.postId[0]) ? commentData.postId = ObjectId(formObject.fields.postId[0]) : delete commentData.postId;
            (formObject.fields.userId[0]) ? commentData.userId = ObjectId(formObject.fields.userId[0]) : delete commentData.userId;
            (formObject.fields.comment[0]) ? commentData.comment = formObject.fields.comment[0] : delete commentData.comment;
            (formObject.fields.parentId) ? commentData.parentId = ObjectId(formObject.fields.parentId[0]) : delete commentData.parentId;
            (!_.isEmpty(fileObject)) ? (commentData.mediaUrl = config.apiUrl + fileObject.filePartialPath) : '';

            // Saving Comment
            const comment = await this.repo.store(commentData);
            if (!comment) throw "Error in saving the comment";

            const user = await (new Model(Users)).findOne({_id: ObjectId(comment.userId)}, {userName: 1, firstName: 1,
                lastName: 1, profileUrl: 1, profileThumbnailUrl: 1})

            let comments = {}
            comments.postId = comment.postId;
            comments.userId = comment.userId;
            comments.like = comment.like;
            comments.dislike = comment.dislike;
            comments.comment = comment.comment;
            comments.mediaUrl = comment.mediaUrl;
            comments._id = comment._id;
            comments.createdOn = comment.createdOn;
            comments.modifiedOn = comment.modifiedOn;
            comments.reply = comment.reply;
            comments.username = user[0].userName;
            comments.userfirstName = user[0].firstName;
            comments.userlastName = user[0].lastName;
            comments.userprofileUrl = user[0].profileUrl;
            comments.userThumbnailUrl = user[0].profileThumbnailUrl;
            comments.likeCounts = comment.like.length;
            comments.dislikeCounts = comment.dislike.length;
            comments.likeByuser = false;
            comments.dislikeByuser = false;


            // Check whether parent comment exist or not
            if(!formObject.fields.parentId) {
                comments.replies = [];
                
                const userData = await (new Post(Posts)).getPostCreatorData({_id: ObjectId(formObject.fields.postId[0])});
                console.log("post details",userData)
                let pushMessage = "commented your post about"
                if(formObject.fields.userId[0] != userData[0].userId ){
                    console.log("i am here in formobject")
                    console.log("post", post);
                    let newNotification = {
                        toUserID:userData[0].userId,
                        fromUserID:formObject.fields.userId,
                        toMessage:pushMessage,
                        type:"comment",
                        commentID:comment._id,
                        storeID:userData[0].storeId,
                        postID:comment.postId
                    };
                    const saveNotification = await (new Model(Notifications)).store(newNotification);
                    if (!saveNotification) throw "Error in saving the comment";
                    console.log('saveNotification', saveNotification);
                    const user = await (new Model(Users)).findOne({_id:ObjectId(userData[0].userId)});
                    console.log("shivani - ",user[0])
                    if(user[0]['notification']){
                        let requestPushNotificationObj = {};
                        const notificationBadgeCount = await (new Model(Users)).incrementValue({_id: userData[0].userId});
                        requestPushNotificationObj.message = `${comments.userfirstName} ${comments.userlastName} ${pushMessage} ${userData[0].storeName}.`
                        requestPushNotificationObj.name = comments.username;
                        requestPushNotificationObj.userImageUrl = comments.userThumbnailUrl;
                        requestPushNotificationObj.type = 'comment';
                        requestPushNotificationObj.postId = userData[0]['_id'];
                        requestPushNotificationObj.storeId = userData[0]['storeId'];
                        requestPushNotificationObj.firstName = user[0]['firstName'];
                        requestPushNotificationObj.lastName = user[0]['lastName'];
                        requestPushNotificationObj.storeName = userData[0]['storeName'];
                        if(notificationBadgeCount != undefined){
                            requestPushNotificationObj.badge = notificationBadgeCount.badge;
                        }
                        requestPushNotificationObj.deviceToken = user[0].deviceToken;
                        let sendPushNotification  = await PushNotification.send(requestPushNotificationObj);
                    }

                }
                return _this.res.send({status: 1, message: "Comment saved successfully", comments});
            }

            // Updating parent comment with child comment id
            let reply = [...parentComment[0].reply];
            reply.push(ObjectId(comment._id));

            const updatedParentComment = await this.repo.update({_id: ObjectId(parentComment[0]._id)}, {reply});

            return _this.res.send({status: 1, message: "Comment saved successfully", comments});

        } catch (err) {
            console.error("Comment Store Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Get Comment
    show() {
        let _this = this;

    }

    // Update Comment
    update(commentId) {
        let _this = this;

    }

    // Delete Comment
    destroy(commentId) {
        let _this = this;
    }

}

module.exports = CommentController;
