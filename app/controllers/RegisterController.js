/****************************
 REGISTER CONTROLLER
 ****************************/
let Controller = require("./Controller");
let validator = require("email-validator");
let Email = require("../services/Email");
let Form = require("../services/Form");
let DateHelper = require("../services/DateHelper");
let Authentication = require("../models/AuthenticationSchema").Authtokens;
let File = require("../services/File");
let Globals = require("../../configs/Globals");
let ObjectId = require('mongodb').ObjectID;
let bcrypt = require('bcrypt')
let multiparty = require('multiparty');
let crypto = require('crypto')
const config = require('../../configs/configs');
let _ = require("lodash");
let Users = require("../models/RegisterSchema").Users;
let Model = require("../models/Model");

class RegisterController extends Controller{

    constructor(repo) {
        super();
        this.repo = repo;
    }

    // Store User
    store() {
        let _this = this;

        // Validating the field
        if (!this.req.body.email || !validator.validate(this.req.body.email)) return _this.res.send({status: 'Error', message: 'Please enter correct email'});

        // Setting the filter and projection field
        let filter = {email: new RegExp('^'+this.req.body.email+'$', "i")};
        let projection = {_id: 1, email: 1, createdOn: 1, otp: 1, isVerified: 1, fbId: 1};

        // Call to find user
        this.repo.getUser(filter, projection).then((user) => {
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';
            if (!_.isEmpty(user) && user.isVerified) throw 'User already exists';

            // Generate random 4 digit otp
            let otp = Math.floor(1000 + Math.random() * 9000);
            let userData = {email: this.req.body.email, otp};
            let mailObject = {
                "address": userData.email,
                "subject": "Quickee Sign Up OTP",
                "text": "Please enter OTP on app to verify your account",
                "html": "<b>OTP to verify your account: </b>"+ otp,
            }

            // Send the otp
            let mail = new Email(mailObject)
            mail.send().then(() => {

            }).catch((error) => {
                _this.res.send({status: 0, message: error});
            });

            // Checking conditions
            if ((!_.isEmpty(user) && !user.isVerified && user.fbId) || (!_.isEmpty(user) && !user.isVerified)) {

                // Setting the fields
                let filter = {email: user.email};
                let setUserData = {otp, modifiedOn: new Date()};

                // Update the user detail
                this.repo.updateUser(filter, setUserData).then((user) => {
                    if (!user) throw 'User is not updated with otp.';

                    _this.res.send({status: 1, message: "OTP has sent to registered email, Please check mail for OTP.", data: {user}});
                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });

            }

            if(_.isEmpty(user)) {
                // Call to save the user
                this.repo.saveUser(userData).then((createdUserObject) => {
                    _this.res.send({status: 1, message: "OTP has sent to registered email, Please check mail for OTP.", data: {user: createdUserObject}});
                }).catch((error) => {
                    _this.res.send({status: 0, message: error});
                });
            }


        }).catch((error) => {
            console.log(error, "errorrrrrrrrr")
            _this.res.send({status: 0, message: error});
        });
    }

    // Store FB user
    async storeFbUser() {
        let _this = this;

        // Validating the field
        if (!this.req.body.fbId && !this.req.body.email) return _this.res.send({status: 'Error', message: 'Please enter correct Fb Id'});
        let filterArray = [];

        if(this.req.body.fbId) {
            filterArray.push({fbId: this.req.body.fbId});
        }

        if(this.req.body.email) {
            filterArray.push({email: this.req.body.email});
        }

        // Setting the filter and projection field
        let filter = { $or: filterArray};
        let projection = {};

        // Call to find user
        this.repo.getUser(filter, projection).then((user) => {
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';

            if (!_.isEmpty(user) && user.isVerified) {

                let authToken = new Globals();
                authToken.getToken(user._id).then(async (token) => {
                    if(!token) throw 'Problem in generating the token';

                    // Update user data with device token
                    const updatedUser = await (new Model(Users)).update({_id: user._id}, {deviceToken: this.req.body.deviceToken});

                    if(!user.fbId && (user.email && user.email == this.req.body.email)) {

                        // Setting the fields
                        let filter = {email: user.email};
                        let setUserData = {fbId: this.req.body.fbId, modifiedOn: new Date()};

                        // Update the user detail
                        this.repo.updateUser(filter, setUserData).then((user) => {
                            if (!user) throw 'Problem in updating fb link with email.';

                            user.token = token;

                            return _this.res.send({status: 1, message: "FB account has been linked with email", data: {user, token}});

                        }).catch((error) => {
                            console.log(error, "error")
                            _this.res.send({status: 0, message: error});
                        });

                    } else {

                        user.token = token;
                        return _this.res.send({status: 1, message: "User is already registered with FB", data: {user, token}});

                    }

                }).catch((error) => {
                    _this.res.send({status: 0, message: error});
                });

            }

            if(!_.isEmpty(user) && !user.isVerified){

                _this.res.send({status: 1, message: "FB User exist but not verified.", data: {user, token: ""}});

            }

            if(_.isEmpty(user)) {

                let userData = {};
                this.req.body.fbId ? (userData.fbId = this.req.body.fbId) : delete userData.fbId;
                this.req.body.email ? (userData.email = this.req.body.email) : delete userData.email;

                // Call to save the user
                this.repo.saveUser(userData).then((createdUserObject) => {
                    _this.res.send({status: 1, message: "User is saved successfully with FB details", data: {user: createdUserObject, token: ""}});
                }).catch((error) => {
                    _this.res.send({status: 0, message: error});
                });

            }

        }).catch((error) => {
            console.log(error, "errorrrrrrrrr in fb")
            _this.res.send({status: 0, message: error});
        });
    }

    // Store Mobile User
    async storeMobileUser() {
        let _this = this;

        // Validating the field
        if (!this.req.body.phoneNo) return _this.res.send({status: 'Error', message: 'Please enter correct Phone number'});

        try {
            // Setting the filter and projection field
            let filter = { phoneNo:this.req.body.phoneNo};
            let projection = {};

            // Calling user model
            const user = await this.repo.getUser(filter, projection);
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';

            // Condition for login
            if (!_.isEmpty(user) && user.isVerified) {

                let authToken = new Globals();
                const token = await authToken.getToken(user._id);
                if(!token) throw 'Problem in generating the token'

                // Update device token
                const updatedUser = await (new Model(Users)).update({_id: user._id}, {deviceToken: this.req.body.deviceToken});

                return _this.res.send({status: 1, message: "User is logged in with Mobile", data: {user, token}});

            }

            // User exist but not verified
            if(!_.isEmpty(user) && !user.isVerified){

                return _this.res.send({status: 1, message: "Mobile User exist but not verified.", data: {user, token: ""}});

            }

            // User saved with mobile details (Signup)
            if(_.isEmpty(user)) {

                let userData = {};
                this.req.body.phoneNo ? (userData.phoneNo = this.req.body.phoneNo) : delete userData.phoneNo;

                // Call to save the user
                const createdUserObject = await this.repo.saveUser(userData);

                return _this.res.send({status: 1, message: "User is saved successfully with Mobile details", data: {user: createdUserObject, token: ""}});

            }

        } catch (err) {
            console.log("Store Mobile User", err)
            return _this.res.send({status: 0, message: err});
        }

    }

    // Get User
    async show() {
        let _this = this;

        try {
            // Setting the filter and projection object
            let filter = {};
            // this.req.query.userName ? (filter["userInfo.userName"] = new RegExp('^'+this.req.query.userName+'$', "i")) : delete filter["userInfo.userName"];
            this.req.query.userName ? (filter.userName = new RegExp('^'+this.req.query.userName+'$', "i")) : delete filter.userName;
            this.req.query.id ? (filter._id = ObjectId(this.req.query.id)) : delete filter._id;

            let projection = { _id: 1, email: 1, userName: 1, fbId: 1, phoneNo: 1, profileThumbnailUrl: 1, profileUrl: 1, status: 1, firstName: 1,
                lastName: 1, bio: 1, notification: 1, badge: 1};

            // Calling user model
            const user = await this.repo.getUser(filter, projection);
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';
            if (!user) throw 'User is not found';

            _this.res.send({status: 1, message: "User found successfully", data: {user}});

        } catch (err) {
            console.log("Show user", err)
            _this.res.send({status: 0, message: err});
        }

    }

    // Method to Verify OTP
    verifyOTP(id) {
        let _this = this;

        // Validating the field
        if (!id || !this.req.body.otp) return _this.res.send({status: 'Error', message: 'Please enter correct details'});

        // Setting the filter and projection field
        let filter = {_id: id, otp: this.req.body.otp};
        let projection = {_id: 1, email: 1, createdOn: 1, modifiedOn: 1};

        // Call to find user
        this.repo.getUser(filter, projection).then((user) => {
            if (!user) throw 'Invalid OTP';

            let promise = new Promise((resolve) => {

                DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then((hours) => {
                    if(hours > 30) {  _this.res.send({status: 1, message: "OTP is expired."}); }

                    resolve(null);

                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });

            });

            promise.then((status) => {

                // Setting the fields
                let filter = {_id: id};
                let setUserData = {otp: ""};

                // Update the user detail
                this.repo.updateUser(filter, setUserData).then((user) => {
                    if (!user) throw 'User is not updated';

                    _this.res.send({status: 1, message: "User account is verified successfully"});

                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });

            });

        }).catch((error) => {
            _this.res.send({status: 0, message: error});
        });
    }

    // Update User
    async update(userId) {
        let _this = this;

        try {
            // Setting the filter and update object
            let filter = {_id: userId};
            let setUserData = {modifiedOn: new Date()};
            this.req.body.isVerified ? (setUserData.isVerified = this.req.body.isVerified) : delete setUserData.isVerified;
            this.req.body.status ? (setUserData.status = this.req.body.status) : delete setUserData.status;
            this.req.body.otp ? (setUserData.otp = this.req.body.otp) : delete setUserData.otp;

            // Calling the user model
            const user = await this.repo.updateUser(filter, setUserData);
            if (!user) throw 'User is not updated';

            _this.res.send({status: 1, message: "User is updated successfully"});

        } catch (err) {
            console.log("Update user", err);
            _this.res.send({status: 0, message: err});
        }

    }

    // Method to Update Signup detail
    async updateSignupDetail(id) {
        let _this = this;
        let form = new Form(this.req);

        // Parsing the form
        form.parse().then((formParseObject) => {
            let thumbnailPath = '';
            let fileUrlObject = {};

            let promise = new Promise((resolve) => {
                if(!formParseObject.files.file) return resolve(null);
                    console.log("resolve ", resolve);
                // Calling method to Save the file
                let file = new File(formParseObject.files);
                file.store().then(async (fileObject) => {
                    if (!fileObject) return resolve(null);

                    thumbnailPath = await file.generateThumbnail({srcPath: fileObject.filePartialPath});

                    fileUrlObject = fileObject;
                    fileUrlObject.thumbnailPartialPath = thumbnailPath;

                    return resolve(fileUrlObject);

                }).catch((error) => {
                    console.log(error, "store error")
                    _this.res.send({status: 0, message: error});
                });
            });

            promise.then((fileUploadObject) => {
                // Validate and Set the fields
                if (!id || !formParseObject.fields.firstName || !formParseObject.fields.lastName || !formParseObject.fields.userName) return _this.res.send({status: 'Error', message: 'Please enter correct details'});

                let filter = {_id: ObjectId(id)};
                let password = (formParseObject.fields.password) ? bcrypt.hashSync(formParseObject.fields.password[0].toString(), 10) : '';
                let profileUrl = (fileUploadObject) ? (config.apiUrl +  fileUploadObject.filePartialPath) : ''
                let profileThumbnailUrl = (fileUploadObject) ? (config.apiUrl + fileUploadObject.thumbnailPartialPath) : ''
                let setUserData = {password, status: "Active", otp: "", isVerified: true, deviceToken: formParseObject.fields.deviceToken,
                    firstName: formParseObject.fields.firstName, lastName: formParseObject.fields.lastName, userName: formParseObject.fields.userName,
                    profileUrl: profileUrl, profileThumbnailUrl: profileThumbnailUrl , modifiedOn: new Date()};

                // Call to update the Data
                _this.repo.updateUser(filter, setUserData).then((user) => {
                    if (!user) throw 'User is not updated';

                    let authToken = new Globals();
                    authToken.getToken(user._id).then((token) => {
                        if(!token) throw 'Problem in generating the token';

                        _this.res.send({status: 1, message: "User is registered successfully", data: {user, token}});
                    }).catch((error) => {
                        console.log("error = ", error);
                        _this.res.send({status: 0, message: error});
                    });

                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });
            });

        }).catch((error) => {
            console.log(error, "error")
            _this.res.send({status: 0, message: error});
        });

    }

    // Resend OTP by Mail
    async resendOTP() {
        let _this = this;

        // Validating the field
        if (!this.req.body.email || !validator.validate(this.req.body.email)) return _this.res.send({status: 'Error', message: 'Please enter correct email'});

        try {
            // Setting the filter and projection field
            let filter = {email: new RegExp('^'+this.req.body.email+'$', "i")};
            let projection = {_id: 1, email: 1, createdOn: 1, otp: 1, isVerified: 1, fbId: 1};

            // Calling the user model
            const user = await this.repo.getUser(filter, projection);
            if (!_.isEmpty(user) && user.isVerified) throw 'User is already registered.';

            // Generate OTP
            let otp = Math.floor(1000 + Math.random() * 9000);
            let email = this.req.body.email;

            // Send Mail
            let mailObject = {
                "address": email,
                "subject": "Quickee Sign Up OTP",
                "text": "Please enter OTP on app to verify your account",
                "html": "<b>OTP to verify your account: </b>"+ otp,
            }

            // Mail the otp
            let mail = new Email(mailObject)
            mail.send()

            // Setting the fields
            filter = {email: new RegExp('^'+email+'$', "i")};
            let setUserData = {otp, modifiedOn: new Date()};

            // Update the user detail
            const updatedUser = await this.repo.updateUser(filter, setUserData)
            if (!updatedUser) throw 'User is not updated';

            _this.res.send({status: 1, message: "OTP has sent to registered email, Please check mail for OTP."});

        } catch (err) {
            console.log("Resend otp", err);
            _this.res.send({status: 0, message: err});
        }

    }

    destroy(leaveId) {
        let _this = this;
    }

    // Recover the password
    async recoverPassword() {
        let _this = this;

        // Validating the field
        if (!this.req.body.email || !validator.validate(this.req.body.email)) return _this.res.send({status: 'Error', message: 'Please enter correct email'});

        try {
            // Setting the filter and projection Object
            let email = this.req.body.email;
            let verificationToken;

            let filter = {email: new RegExp('^'+this.req.body.email+'$', "i"), isVerified: true};
            let projection = {_id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1};

            // Calling user model
            const user = await this.repo.getUser(filter, projection)
            if (_.isEmpty(user)) throw 'User does not exist';
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';
            if (!_.isEmpty(user) && user.forgotToken) throw 'Recover password link is already sent to the registered email.';

            // Generate token and send in mail
            crypto.randomBytes(48, async (err, buffer) => {
                verificationToken = buffer.toString('hex');

                // let passwordResetLink = 'http://10.2.2.52:5023/public/password-reset.html?token='+verificationToken+'&id='+user._id;
                let passwordResetLink = config.apiUrl + '/public/password-reset.html?token='+verificationToken+'&id='+user._id;

                let mailObject = {
                    "address": email,
                    "subject": "Quickee Password Recover Link",
                    "text": "Please click on the link below to recover your password.",
                    "html": "<b>Please click on the link below to recover your password: </b><br><br><a href='"+passwordResetLink+"'>"+ passwordResetLink +"</a>"
                }

                // Mail the otp
                let mail = new Email(mailObject)
                mail.send()

                filter = {email: new RegExp('^'+email+'$', "i")};
                let setUserData = {forgotToken: verificationToken, modifiedOn: new Date()};

                // Update the user detail
                const updatedUser = await this.repo.updateUser(filter, setUserData)
                if (!updatedUser) throw 'Token is not updated for user';

                _this.res.send({status: 1, message: "Password has been sent to the registered email-id."});

            });

        } catch (err) {
            console.log("Recover password", err)
            _this.res.send({status: 0, message: err});
        }

    }

    // Method to Reset the password
    resetPassword() {
        let _this = this;

        if (!this.req.body.token || !this.req.body.password || !this.req.body.id) return _this.res.send({status: 0, message: 'Please enter all details.'});

        let filter = {_id: ObjectId(this.req.body.id), isVerified: true};
        let projection = {_id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1};

        // Call to find user
        this.repo.getUser(filter, projection).then((user) => {
            if (_.isEmpty(user)) throw 'User with above details does not exist';
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';
            if (!_.isEmpty(user) && !user.forgotToken) throw 'Link is expired.';

            let promise = new Promise((resolve) => {

                DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then((hours) => {
                    if(hours > 1) { _this.res.send({status: 1, message: "Link is expired."}); }

                    resolve(null)

                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });

            });

            promise.then((status) => {

                // Setting the fields
                let password = bcrypt.hashSync(this.req.body.password, 10);
                let setUserData = {forgotToken: "", modifiedOn: new Date(), password};

                // Update the user detail
                this.repo.updateUser(filter, setUserData).then((user) => {
                    if (!user) throw 'Password has not been set for user.';

                    _this.res.send({status: 1, message: "Password has been changed successfully."});

                }).catch((error) => {
                    console.log(error, "error")
                    _this.res.send({status: 0, message: error});
                });

            });

        });
    }

    // Sign in with Email/Password
    async signIn() {
        let _this = this;

        // Validating field
        if (!this.req.body.email || !this.req.body.password) return _this.res.send({status: 0, message: 'Please enter all credentials.'});

        try {
            // Setting filter and projection object
            let filter = {email: new RegExp('^'+this.req.body.email+'$', "i"), isVerified: true};
            let projection = {_id: 1, email: 1, password: 1, isVerified: 1, isDeleted: 1, deviceToken: 1, userName: 1,
                firstName: 1, lastName: 1, profileUrl: 1, profileThumbnailUrl: 1};

            // Calling user model
            const user = await this.repo.getUser(filter, projection);
            console.log(user, "userrrrrjkngkfhgk", this.req.body.deviceToken)
            if (_.isEmpty(user)) throw 'User does not exist';
            if(!_.isEmpty(user) && user.isDeleted) throw 'User is blocked by Admin.';

            // Password comparison
            const status = await bcrypt.compare(_this.req.body.password, user.password)
            if(!status) throw 'Authentication Failed, Invalid Password.';
            console.log(user._id, "user._id", this.req.body.deviceToken)
            const updatedUser = await this.repo.updateUser({_id: user._id}, {deviceToken: this.req.body.deviceToken, modifiedOn: new Date()});
            if (!updatedUser) throw 'User is not get updated by device token';
            console.log(updatedUser, "updatedUser")
            // Generate Token
            let authToken = new Globals();
            const token = await authToken.getToken(user._id);
            if(!token) throw 'Problem in generating the token';

            return _this.res.send({status: 1, message: "User is authenticated successfully", data: {user,token}});

        } catch(err) {
            console.log("Sign in", err)
            _this.res.send({status: 0, message: err});
        }

    }

    // Signout
    async signout() {
        let _this = this;

        // Validating field
        if(!this.req.query.userId) return _this.res.send({status: 0, message: 'Bad request. Please provide the user id'});

        try {
            // Setting filter object
            let filter = {_id: ObjectId(this.req.query.userId), isVerified: true};
            let projection = {_id: 1, email: 1, isVerified: 1, deviceToken: 1, isDeleted: 1,};

            // Calling user and authentication model
            const user = await this.repo.getUser(filter, projection);
            if (_.isEmpty(user)) throw 'User does not exist';

            await Authentication.remove({ userId: String(this.req.query.userId) });

            const updatedUser = await _this.repo.updateUser({_id: ObjectId(this.req.query.userId)}, {deviceToken: '', modifiedOn: new Date()});
            if (!updatedUser) throw 'User is not get updated by device token';

            _this.res.send({status: 1, message: "User logout successfully"});

        } catch(err) {
            console.log("Sign out", err)
            _this.res.send({status: 0, message: err});
        }

    }

}

module.exports = RegisterController;
