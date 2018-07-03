/****************************
 PAGINATION HANDLING OPERATIONS
 ****************************/
let config = require('../../configs/configs');
let _ = require("lodash");

class Pagination {

    constructor(params,collection) {
        this.params = (!params.group) ? {} : params.group;
        this.collection = collection;
    }

    // Set Current Page
    currentPage() {
        return (typeof this.params.page === "undefined") ? 1 : this.params.page;
    }

    // Set Offset
    offset() {
        let page = this.currentPage();
        let perPage = Pagination.limit();
        return (page - 1) * perPage
    }

    // Set Limit
    static limit() {
        return (config.perPage === "undefined") ? 10 : config.perPage;
    }

    // Set Sort and paginate fields
    stages() {
        let stages = [];

        if (typeof this.params.sortBy !== 'undefined'
            && this.params.sortBy !== ''
            && typeof this.params.order !== 'undefined'
            && this.params.order !== ''
        ) {
            let sort = {};
            sort[this.params.sortBy] = (this.params.order === 'asc') ? 1 : -1;
            stages.push({$sort: sort});
        }

        stages.push({$skip: this.offset()}, {$limit: Pagination.limit()});

        return stages;
    }

    // Paginate Aggregration Query
    paginate(stages, paginate = true) {
        return new Promise(async (resolve, reject) => {

            let aggregationStages = _.clone(stages);

            if (paginate) {
                aggregationStages = aggregationStages.concat(this.stages());
            }

            try {
                const totalCount = await this.count(stages);
                const data = await this.collection.aggregate(aggregationStages);
                // console.log("totalCount = ", totalCount);
                // console.log("curr page = ", this.currentPage());
                // console.log("perPage = ", Pagination.limit());
                let result = {
                    total: totalCount,
                    curPage: this.currentPage(),
                    perPage: Pagination.limit(),
                    data
                }
                // console.log("resul;t = ", result);
                return resolve(result);

            } catch (err) {
                console.log("aggregration pagination error", err);
                return reject({message: err, status: 0 });
            }

        });
    }

    // Find Paginate Aggregration Query
    findPaginate(filter, projection) {
        return new Promise(async (resolve, reject) => {

            try {
                const totalCount = await this.findCount(filter);
                const data = await this.collection.find(filter, projection, {skip: this.offset(), limit: Pagination.limit()});

                let result = {
                    total: totalCount,
                    curPage: this.currentPage(),
                    perPage: Pagination.limit(),
                    data
                }

                return resolve(result);

            } catch (err) {
                console.log("Find pagination error", err);
                return reject({message: err, status: 0 });
            }

        });
    }

    // Count Query
    count(stages) {
        return new Promise(async (resolve, reject) => {

            try {
                const result = await this.collection.aggregate(stages);
                let totalCount = (result.length > 0 && result instanceof Array) ? result.length : 0;

                return resolve(totalCount);

            } catch(err) {
                console.log("Count pagination aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });
    }

    // Count Find Query
    findCount(filter) {
        return new Promise(async (resolve, reject) => {

            try {
                const result = await this.collection.find(filter);
                let totalCount = (result.length > 0 && result instanceof Array) ? result.length : 0;

                return resolve(totalCount);

            } catch(err) {
                console.log("Count Find aggregration error", err);
                return reject({message: err, status: 0 });
            }

        });
    }
}

module.exports = Pagination;