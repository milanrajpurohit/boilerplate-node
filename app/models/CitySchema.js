/**************************
 CITY SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var citySchema = new Schema({

    countryId: { type: Schema.Types.ObjectId, ref: 'countries' },
    stateId: { type: Schema.Types.ObjectId, ref: 'states' },
    cityCode: {
        type: String
    },
    cityName: {
        type: String
    },
    createdOn: {type: Date, default: Date.now},

});

var Cities = mongoose.model('cities', citySchema);

module.exports = {
    Cities: Cities,
}

