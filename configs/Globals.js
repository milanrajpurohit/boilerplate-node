/****************************
 SECURITY TOKEN HANDLING
 ****************************/
let config = require('./configs');
let Authentication = require('../app/models/AuthenticationSchema').Authtokens;
let User = require('../app/models/RegisterSchema').Users;

class Globals {

    constructor() {

    }

    // Generate Token
    getToken(id) {
        let _this = this;

        return new Promise(async (resolve, reject) => {

            try {
                // Generate Token
                let token = jwt.sign({
                    id: id,
                    algorithm: "HS256",
                    exp: Math.floor(new Date().getTime() / 1000) + config.tokenExpiry
                }, config.securityToken);

                let params = {userId: id, token: token};

                const authentication = await Authentication.findOneAndUpdate({userId: id}, params, {upsert: true});

                return resolve(token);

            } catch(err) {
                console.log("Get token", err);
                return reject({message: err, status: 0 });
            }

        });

    }

    // Validating Token
    static async isAuthorised(req, res, next) {

        try {
            const token = req.headers.authorization;
            if(!token) return res.status(401).json({status: 0, message: 'Please send token with api.' });

            const authenticate = new Globals();

            const userExist = await authenticate.checkUserInDB(token);
            if (!userExist) return res.status(401).json({status: 3, message: 'User is blocked by Admin.' });

            const tokenCheck = await authenticate.checkTokenInDB(token);
            if (!tokenCheck) return res.status(401).json({status: 2, message: 'Invalid token.' });

            // const tokenExpire = await authenticate.checkExpiration(token);
            // if (!tokenExpire) return res.status(401).json({status: 2, message: 'Token is expired.' });

            next();

        } catch(err) {
            console.log("Token authentication", err);
            return res.send({status: 0, message: err});
        }

    }

    // Check User Existence in DB
    checkUserInDB(token) {

        return new Promise(async (resolve, reject) => {

            try {
                // Initialisation of variables
                let decoded = jwt.decode(token);
                if(!decoded) { return resolve(false); }
                let userId = decoded.id

                const user = await User.findOne({_id: userId, isDeleted: false});
                
                if(user) return resolve(true);

                return resolve(false);

            } catch(err) {
                console.log("Check user in db")
                return reject({message: err, status: 0 });
            }

        })

    }

    // Check token in DB
     checkTokenInDB(token) {

        return new Promise(async (resolve, reject) => {

            try {
                // Initialisation of variables
                let decoded = jwt.decode(token);
                if(!decoded) { return resolve(false); }
                let userId = decoded.id

                const authenticate = await Authentication.findOne({userId: userId, token});
                if(authenticate) return resolve(true);

                return resolve(false);

            } catch(err) {
                console.log("Check token in db")
                return reject({message: err, status: 0 });
            }

        })

    }

    // Check Token Expiration
    checkExpiration(token) {

        return new Promise((resolve, reject) => {

            // Initialisation of variables
            var decoded = jwt.decode(token);
            let now = parseInt(new Date().getTime() / 1000);
            let expTime = decoded.exp;
            let status = false;

            if (expTime > now) { status = true; resolve(status); }

            resolve(status);

        })

    }

    static calculateStoreAvgRating(rate){
        return new Promise((resolve, reject)=>{
            let storeAvgRate = 0;
            let x = Math.round(rate);
            if((x-0.50) <= rate && (x-0.25) >= rate){
                storeAvgRate = (x-0.50);
            }

            if((x-0.25) <= rate && x >= rate){
                storeAvgRate = x
            }

            if(x <= rate && (x+0.25) >= rate){
                storeAvgRate = x;
            }

            if((x+0.25) <= rate && (x+0.50) >= rate){
                storeAvgRate = (x+0.50);
            }
            return resolve(storeAvgRate);
        });
    }

}

module.exports = Globals;