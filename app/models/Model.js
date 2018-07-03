/****************************
 COMMON MODEL
 ****************************/
let _ = require("lodash");

class Model {

    constructor(collection) {
        this.collection = collection;
    }

    // Find all data
    find(filter = {}, project = {}, paginate = {}) {

        return new Promise((resolve, reject) => {

            this.collection.find(filter, project).exec((err, data) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);
            });

        });

    }

    // Find single data
    findOne(filter = {}, project = {}) {

        return new Promise((resolve, reject) => {

            this.collection.find(filter, project).exec((err, data) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);
            });

        });
    }

    // Update Data
    update(filter, data) {

        return new Promise((resolve, reject) => {

            this.collection.findOneAndUpdate(filter, {$set: data}, { upsert: true, new: true }, (err, data)  => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);

            });

        });

    }

    // Update Multiple Data
    updateMany(filter, data) {

        return new Promise((resolve, reject) => {

            this.collection.update(filter, {$set: data}, {multi: true}, (err, data)  => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);

            });

        });

    }

    // Soft Delete
    softDelete(id) {
        return new Promise((resolve, reject) => {

        });
    }

    // Store Data
    store(data, options = {}) {

        return new Promise((resolve, reject) => {

            const collectionObject = new this.collection(data)

            collectionObject.save((err, createdObject) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(createdObject);
            });

        });
    }

    // Delete Data
    destroy(filter) {

        return new Promise((resolve, reject) => {

            this.collection.remove(filter).exec((err, data) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);
            });

        });
    }

    // Setting the Sort Params
    stages(params) {

        let stages = [];

        if (typeof params.sortBy !== 'undefined'
            && params.sortBy !== ''
            && typeof params.order !== 'undefined'
            && params.order !== ''
        ) {
            let sort = {};
            sort[params.sortBy] = (params.order === 'asc') ? 1 : -1;
            stages.push({$sort: sort});
        }

        return stages;
    }

    // Aggregration
    aggregate(stages, query) {
        return new Promise(async (resolve, reject) => {

            let aggregationStages = _.clone(stages);

            aggregationStages = aggregationStages.concat(this.stages(query));

            try {
                const data = await this.collection.aggregate(aggregationStages);

                let result = {data};
                return resolve(result);

            } catch (err) {
                console.log("Aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });
    }
    incrementValue(filter) {

        return new Promise((resolve, reject) => {

            this.collection.findOneAndUpdate(filter, {$inc: { badge: 1 }}, { new: true }, (err, data)  => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(data);

            });

        });

    }
}

module.exports = Model;