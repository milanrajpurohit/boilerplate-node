/**************************
 COMMENT SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var commentSchema = new Schema({

    comment: {
        type: String
    },
    mediaUrl: {
        type: String
    },
    like: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    dislike: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    reply: [{ type: Schema.Types.ObjectId, ref: 'comments' }],
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    parentId: { type: Schema.Types.ObjectId, ref: 'comments' },
    postId: { type: Schema.Types.ObjectId, ref: 'posts' },
    createdOn: {type: Date, default: Date.now},
    modifiedOn: {type: Date, default: Date.now},

});

var Comments = mongoose.model('comments', commentSchema);

module.exports = {
    Comments: Comments,
}

