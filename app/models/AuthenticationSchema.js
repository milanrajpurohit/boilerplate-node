/**************************
 AUTHENTICATION SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');

var authtokensSchema = new Schema({

    userId:   { type: Schema.Types.ObjectId, ref: 'users' },
    token:  String,
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

});

var Authtokens = mongoose.model('authtokens', authtokensSchema);

module.exports = {
    Authtokens: Authtokens,
}

