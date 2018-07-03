/**************************
 FAVOURITE SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var favouriteSchema = new Schema({

    favouritedByUserId: { type: Schema.Types.ObjectId, ref: 'users' },
    postId: { type: Schema.Types.ObjectId, ref: 'posts' },
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

});

var Favourites = mongoose.model('favourites', favouriteSchema);

module.exports = {
    Favourites: Favourites,
}

