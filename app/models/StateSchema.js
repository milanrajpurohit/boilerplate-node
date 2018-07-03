/**************************
 STATE SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var stateSchema = new Schema({

    countryId: { type: Schema.Types.ObjectId, ref: 'countries' },
    stateCode: {
        type: String
    },
    stateName: {
        type: String
    },
    createdOn: {type: Date, default: Date.now},

});

var States = mongoose.model('states', stateSchema);

module.exports = {
    States: States,
}

