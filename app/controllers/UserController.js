/****************************
 USER CONTROLLER
 ****************************/
const Controller = require("./Controller");
const ObjectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt')
const config = require('../../configs/configs');
const Form = require("../services/Form");
const File = require("../services/File");
const Model = require("../models/Model");
const Users = require("../models/RegisterSchema").Users;
const Posts = require("../models/PostSchema").Posts;
const Follows = require("../models/FollowSchema").Follows;
const Blocks = require("../models/BlockSchema").Blocks;
const _ = require("lodash");

class UserController extends Controller{

    constructor(repo) {
        super();
        this.repo = repo;
    }

    // Get User List
    async collection() {
        let _this = this;

        // Validating the field
        if (!this.req.query.offset || !this.req.query.limit) return _this.res.send({status: 0, message: 'Please enter offset and limit'});

        try {
            // Setting the field
            let filter = {role: {$ne: "admin"}};
            let others = {skip: parseInt(this.req.query.offset), limit: parseInt(this.req.query.limit)};

            // Calling user model
            const users =  await this.repo.getUsers(filter, {}, others);
            if (!users) return _this.res.send({status: 1, message: 'Users are not found', data: []});

            return _this.res.send({status: 1, message: "Users found successfully", data: {users}});

        } catch (err) {
            console.error("User listing Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Update User
    async update(userId) {
        let _this = this;

        try {
            // Setting the filter and update object
            let filter = { _id: userId};
            let updateObject = {isDeleted: this.req.body.isDeleted};

            // Calling user model
            const user = await this.repo.update(filter, updateObject);

            const data = await (new Model(Follows)).updateMany({$or: [{followBy: userId}, {followTo: userId}]}, {isValid: false})

            return _this.res.send({status: 1, message: "User is updated successfully", data: user});

        } catch (err) {
            console.error("User update Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Find Users
    async usersDetails() {
        let _this = this;

        // Validating the field
        if (!this.req.body.users.length) return _this.res.send({status: 0, message: 'Please send user id in the request array.'});

        try {
            // Setting the filter object
            let filter = {_id: { $in : this.req.body.users } };

            // Calling user model
            const users = await this.repo.find(filter, {});
            if (!users.length) { return _this.res.send({status: 1, message: "No users found", data: []}); }

            return _this.res.send({status: 1, message: "List of Users", data: users});

        } catch(err) {
            console.error("Users Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Dashboard Users type count for Admin panel
    async dashboardCount() {
        let _this = this;

        try {
            // Calling user model
            const active =  this.repo.getUsers({status: "Active", isVerified: true, isDeleted: false, role: {$ne: "admin"}}, {_id: 1});
            const inactive =  this.repo.getUsers({status: "Inactive", isVerified: true, isDeleted: true, role: {$ne: "admin"}}, {_id: 1});
            // const blocked =  this.repo.getUsers({status: "Blocked", isVerified: true, isDeleted: false, role: {$ne: "admin"}}, {_id: 1});
            const blocked = Blocks.find().distinct("blockedToUserId");
            const count = await Promise.all([active, inactive, blocked]);

            const countObject = {active: count[0].length, inactive: count[1].length, blocked: count[2].length};

            return _this.res.send({status: 1, message: "Different counts for users", count: countObject});

        } catch (err) {
            console.error("Dashboard Count Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Find registered users
    async findFriends(id) {
        let _this = this;

        // Validating the field
        if (!id) return _this.res.send({status: 0, message: 'Please send user id in the url.'});

        try {
            // Setting the filter object
            let requestObject = this.req.body;
            let parsedPhoneNo = [];

            requestObject.phoneNo.filter((mobile) => {
                parsedPhoneNo.push(mobile);
                let customisedPhoneNo = "+" + mobile;
                parsedPhoneNo.push(customisedPhoneNo);
                return;
            });

            if(parsedPhoneNo.length == (2*requestObject.phoneNo.length)) {
                let phoneFilter = {phoneNo: { $in: parsedPhoneNo }};
                let email = {email: { $in: requestObject.email }};
                // let filter = { $or: [phoneFilter,email], _id: {$ne: id}, isVerified: true, isDeleted: false};
                let filter = { $or: [phoneFilter,email], _id: {$ne: id}, isVerified: true, isDeleted: false};

                // Calling Block Model to find blocked user
                let blockedIds = await (new Model(Blocks)).find({"blockedByUserId": id}, {"blockedToUserId": 1});

                let blockedUserIds = [];
                blockedIds.filter((id) => {
                    blockedUserIds.push(ObjectId(id.blockedToUserId));
                })
                blockedUserIds.push(id)
                // filter.blockedUserIds = blockedUserIds;
                filter._id = {$nin: blockedUserIds};

                // Calling user model
                // console.log("filter", JSON.stringify(filter));
                const friends = await this.repo.getUserFriends(filter, id);
                if(!friends.length) { return _this.res.send({status: 1, message: "There are no Registered users", data: []}); }

                return _this.res.send({status: 1, message: "List of friends", data: friends});

            }

        } catch (err) {
            console.error("Friend Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Search People
    async searchPeople() {
        let _this = this;

        // Validating the field
        if (!this.req.query.searchString) return _this.res.send({status: 0, message: 'Please enter search string.'});

        try {
            // Setting the field
            let filter = {role: {$ne: "admin"}};
            // let others = {skip: parseInt(this.req.query.offset), limit: parseInt(this.req.query.limit)};

            // Calling user model
            const users =  await this.repo.getUsers(filter, {}, {});
            if (!users) return _this.res.send({status: 1, message: 'Users are not found', data: []});

            return _this.res.send({status: 1, message: "Users found successfully", data: {users}});

        } catch (err) {
            console.error("Search people Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Change Password
    async changePassword() {
        let _this = this;

        // Validating and initialising fields
        if(!this.req.body.userId || !this.req.body.oldpassword || !this.req.body.newpassword) return _this.res.send({status: 0, message: 'Please send all details such as old password, new passowrd and user id.'});

        try {
            // Setting the field
            let filter = {"_id": ObjectId(this.req.body.userId), "isDeleted": false, "isVerified" : true};

            // Calling user model
            const user =  await this.repo.findOne(filter);
            if (!user) return _this.res.send({status: 1, message: 'User is not found', data: []});

            const status = await bcrypt.compare(_this.req.body.oldpassword, user[0].password)
            if(!status) throw 'Old Password does not match.';

            const statusNew = await bcrypt.compare(_this.req.body.newpassword, user[0].password)
            if(statusNew) throw 'New and Old Passwords are similar.';

            let password = bcrypt.hashSync(this.req.body.newpassword, 10);

            const updatedUser = await _this.repo.update({_id: ObjectId(this.req.body.userId)}, {password, modifiedOn: new Date()});
            if (!updatedUser) throw 'User is not get updated.';

            return _this.res.send({status: 1, message: "Password changed successfully"});

        } catch (err) {
            console.error("Change Password Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Profile Update
    async updateProfile(id) {
        let _this = this;

        try {
            let filter = {_id: id};
            let fileObject = {};
            let thumbnailPath = '';
            let fileUrlObject = {};

            const form = new Form(this.req);
            const formObject = await form.parse();

            // Check Username and email exists
            if(formObject.fields.email || formObject.fields.userName) {
                let filterArray = []
                let tempObj = {};
                (formObject.fields.userName) ? filterArray.push({userName: formObject.fields.userName[0]}) : '';
                (formObject.fields.email) ? filterArray.push({email: formObject.fields.email[0]}) : '';

                let filter = { $or: filterArray, _id: {$ne: id}};
                console.log("filter= ", filter);

                const user = await this.repo.findOne(filter);
                if(user.length) return _this.res.send({status: 0, message: "User with Username or Email exist."});

            }

            if(!_.isEmpty(formObject.files)) {
                const file = new File(formObject.files);
                fileObject = await file.store();
                thumbnailPath = await file.generateThumbnail({srcPath: fileObject.filePartialPath});

                fileUrlObject = {...fileObject};
                fileUrlObject.thumbnailPath = thumbnailPath
            }

            // Setting Comment Data
            let profileData = {modifiedOn: new Date()};
            (formObject.fields.firstName) ? profileData.firstName = formObject.fields.firstName[0] : delete profileData.firstName;
            (formObject.fields.lastName) ? profileData.lastName = formObject.fields.lastName[0] : delete profileData.lastName;
            (formObject.fields.userName) ? profileData.userName = formObject.fields.userName[0] : delete profileData.userName;
            (formObject.fields.email) ? profileData.email = formObject.fields.email[0] : delete profileData.email;
            (formObject.fields.notification) ? profileData.notification = formObject.fields.notification[0] : delete profileData.notification;
            (formObject.fields.bio) ? profileData.bio = formObject.fields.bio[0] : delete profileData.bio;
            (formObject.fields.deviceToken) ? profileData.deviceToken = formObject.fields.deviceToken[0] : delete profileData.deviceToken;
            (!_.isEmpty(fileObject)) ? (profileData.profileUrl = config.apiUrl + fileUrlObject.filePartialPath) : '';
            (!_.isEmpty(fileObject)) ? (profileData.profileThumbnailUrl = config.apiUrl + fileUrlObject.thumbnailPath) : '';

            // Calling model to update user
            const updatedUser = await this.repo.update(filter, profileData);

            return _this.res.send({status: 1, message: "User updated successfully", data: updatedUser});

        } catch (err) {
            console.error("Update Profile Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Get Users List
    async userListCollection() {
        let _this = this;

        // Validating the field
        if (!this.req.query.userId) return _this.res.send({status: 0, message: 'Please send user Id'});

        try {
            console.log("in try")
            // Setting the field
            let filter = {role: {$ne: "admin"}, "isDeleted": false, "isVerified" : true};
            let group = {"sortBy": "createdOn", "order": "desc"};
            (this.req.query.page) ? (group.page = this.req.query.page) : delete group.page;

            // Calling Block Model to find blocked user
            let blockedIds = await (new Model(Blocks)).find({"blockedByUserId": ObjectId(this.req.query.loggedInUserId)}, {"blockedToUserId": 1});

            let blockedUserIds = [];
            let blockedUsersIdString = [];
            blockedIds.filter((id) => {
                blockedUserIds.push(ObjectId(id.blockedToUserId));
                blockedUsersIdString.push(id.blockedToUserId.toString());
            })

            // List of all like / Dislike users
            if(this.req.query.postId) {

                // Calling Post model
                const post =  await (new Model(Posts)).findOne({_id: ObjectId(this.req.query.postId), isDeleted: false});

                // Setting filter
                let userIds = (this.req.query.type == 'like') ? post[0].like : post[0].dislike;
                userIds = userIds.filter(val => !blockedUsersIdString.includes(val.toString()));
                filter._id = { $in : userIds };

                console.log("filter - ", filter);
                // Calling user model
                const users =  await this.repo.getVotesList(filter, ObjectId(this.req.query.loggedInUserId), group);
                if (!users.data.length) return _this.res.send({status: 1, message: 'Users are not found', data: []});

                return _this.res.send({status: 1, message: "Users found successfully", data: users});
            }

            filter._id = {$nin: blockedUserIds};
            console.log("filter - ", filter);
            // Following List
            if(this.req.query.type == 'following') {

                // Calling user model
                const users =  await this.repo.getFollowing(filter, ObjectId(this.req.query.userId), group);
                if (!users.data.length) return _this.res.send({status: 1, message: 'Users are not found', data: []});

                return _this.res.send({status: 1, message: "Users found successfully", data: users});
            }

            // Follower List
            if(this.req.query.type == 'follower') {

                // Calling user model
                const users =  await this.repo.getFollowers(filter, ObjectId(this.req.query.userId), group);
                if (!users.data.length) return _this.res.send({status: 1, message: 'Users are not found', data: []});

                return _this.res.send({status: 1, message: "Users found successfully", data: users});

            }

        } catch (err) {
            console.error("User listing Error", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // BLOCK AN USER
    async block() {
        let _this = this;

        // Validating the field
        if (!this.req.body.blockedByUserId || !this.req.body.blockedToUserId) return _this.res.send({status: 0, message: 'Please send proper data.'});

        if (String(this.req.body.blockedByUserId) == String(this.req.body.blockedToUserId)) {
            return _this.res.send({status: 0, message: "User cannot block themselves.", data: []});
        }

        try {
            // Setting the filter and projection field
            const filter = { blockedByUserId: ObjectId(this.req.body.blockedByUserId), blockedToUserId: ObjectId(this.req.body.blockedToUserId) };
            const projection = {_id: 1};

            // Calling Block Model
            const block = await this.repo.findOne(filter, projection);
            if (!_.isEmpty(block)) throw 'User is already Blocked.';

            const blocked = await this.repo.store(filter);

            // Calling Unfollow Model
            const unfollowObject = await (new Model(Follows)).updateMany({ $or: [
                    { 'followBy': ObjectId(this.req.body.blockedByUserId), 'followTo': ObjectId(this.req.body.blockedToUserId) },
                    { 'followBy': ObjectId(this.req.body.blockedToUserId), 'followTo': ObjectId(this.req.body.blockedByUserId) }
                ]}, {"isValid": "false"});

            return _this.res.send({status: 1, message: "User is blocked successfully.", data: blocked});

        } catch (err) {
            console.error("Blocked User Error", err);
            return _this.res.send({status: 0, message: err});
        }

    }

}

module.exports = UserController;