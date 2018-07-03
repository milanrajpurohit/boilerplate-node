/****************************
 REGISTER MODEL
 ****************************/
let User = require("./RegisterSchema").Users;

class Register {

    constructor() {
        this.collection = User;
    }

    // Get User
    getUser(filter = {}, project = {}) {

        return new Promise((resolve, reject) => {

            this.collection.findOne(filter, project).exec((err, user) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(user);
            });

        });

    }

    // Save User
    saveUser(userData = {}) {

        return new Promise((resolve, reject) => {

            let userObject = new User(userData)

            userObject.save((err, createdUserObject) => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(createdUserObject);
            });

        });

    }

    // Update User
    updateUser(filter = {}, userData = {}) {

        return new Promise((resolve, reject) => {

            this.collection.findOneAndUpdate(filter, {$set: userData}, { new: true }, (err, user)  => {

                if (err) { return reject({message: err, status: 0 }); }

                return resolve(user);

            });

        });

    }

}

module.exports = Register;