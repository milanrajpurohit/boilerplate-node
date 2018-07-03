/**************************
 FOLLOW SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var followSchema = new Schema({

    followBy: { type: Schema.Types.ObjectId, ref: 'users' },
    followTo: { type: Schema.Types.ObjectId, ref: 'users' },
    isValid: {type: Boolean, default: true},
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

});

var Follows = mongoose.model('follows', followSchema);

module.exports = {
    Follows: Follows,
}

