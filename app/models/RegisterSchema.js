/**************************
 USER SCHEMA INITIALISATION
 **************************/
 var Schema = require('mongoose').Schema;
 var bcrypt = require('bcrypt');
 var mongoose = require('mongoose');

 var userSchema = new Schema({

    email: {
        type: String
    },
    fbId: {
        type: String
    },
    fbToken: {
        type: String
    },
    password: {
        type:String
    },
    phoneNo: {
        type:String
    },
    deviceToken: {
        type:String
    },
    otp: {
        type:String
    },
    forgotToken: {
        type:String
    },
    last_signedIn: Date,
    isVerified: {type: Boolean, default: false},
    isDeleted: {type: Boolean, default: false},
    status: {type: String, Enum: ["Active","Inactive","Blocked"], default: "Inactive"},
    // userInfo : {
    //     firstName: {
    //         type: String
    //     },
    //     lastName: {
    //         type: String
    //     },
    //     userName: {
    //         type: String
    //     },
    //     profileUrl: {
    //         type:String
    //     },
    //     profileThumbnailUrl: {
    //         type:String
    //     },
    //     physicalAddress: {
    //         type:String
    //     },
    //     dob: Date,
    //     cityId: { type: Schema.Types.ObjectId, ref: 'cities' },
    //     countryId: { type: Schema.Types.ObjectId, ref: 'countries' },
    //     followers: Number,
    //     followees: Number,
    //     favouritePostCounts: Number,
    //     favouriteStoreCounts: Number,
    //     allowNativePhoneAddressBook: {type: Boolean, default: false},
    // },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    userName: {
        type: String
    },
    profileUrl: {
        type:String
    },
    profileThumbnailUrl: {
        type:String
    },
    physicalAddress: {
        type:String
    },
    notification: {type: Boolean, default: true},
    bio: {
        type: String
    },
    dob: Date,
    cityId: { type: Schema.Types.ObjectId, ref: 'cities' },
    countryId: { type: Schema.Types.ObjectId, ref: 'countries' },
    followers: Number,
    followees: Number,
    favouritePostCounts: Number,
    favouriteStoreCounts: Number,
    allowNativePhoneAddressBook: {type: Boolean, default: false},
    badge: {type:Number,default:0},
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

});

 var Users = mongoose.model('users', userSchema);

 module.exports = {
    Users: Users,
}

