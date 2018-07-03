/**************************
 BLOCK SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var blockSchema = new Schema({

    blockedByUserId: { type: Schema.Types.ObjectId, ref: 'users' },
    blockedToUserId: { type: Schema.Types.ObjectId, ref: 'users' },
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

}, {strict: false});

var Blocks = mongoose.model('blocks', blockSchema);

module.exports = {
    Blocks: Blocks,
}

