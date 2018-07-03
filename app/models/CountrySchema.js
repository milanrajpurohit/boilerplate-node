/**************************
 COUNTRY SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var countrySchema = new Schema({

    countryCode: {
        type: String
    },
    countryName: {
        type: String
    },
    createdOn: {type: Date, default: Date.now},

});

var Countries = mongoose.model('countries', countrySchema);

module.exports = {
    Countries: Countries,
}

