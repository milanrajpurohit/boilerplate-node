/****************************
 PUSH NOTIFICATIONS OPERATIONS
 ****************************/
 var apn = require('apn');
 let path = require('path');
 let fs = require('fs');

// let options = {
//     key:  fs.readFileSync(path.resolve(__dirname+'/Quickee.pem')),
//     cert: fs.readFileSync(path.resolve(__dirname+'/Quickee.pem')),
//     production: false
// };

// let apnProvider = new apn.Provider(options);
// Set up apn with the APNs Auth Key
var apnProvider = new apn.Provider({  
 token: {
    key:  fs.readFileSync(path.resolve(__dirname + '/../../configs/AuthKey_G52Y9AZWL6.p8')),
        keyId: 'G52Y9AZWL6', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
        teamId: '98S2S23DLB', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
    },
    production: false // Set to true if sending a notification to a production iOS app
});


// var deviceToken = '1EC2A335AA8E9C052D6087290A30AB1641304E365F6E4A0C8AE97EE212735900';

let _ = require("lodash");

class PushNotification {

    constructor(data) {
        this.data = data;
    }

    // Send push notification
    static send(data) {

      return new Promise(async (resolve, reject) => {

        try {

            var note = new apn.Notification();
                note.expiry = Math.floor(Date.now() / 1000) + 7200; // Expires 1 hour from now.
                note.badge = data.badge;
                note.sound = "ping.aiff";
                note.alert = data.message;
                note.topic = 'com.theweekendedition.quickee';
                note.mutableContent = 1;
                // note['content-available'] = 1;
                note.payload = {
                    "data":{
                        "type":data.type,
                        "postId":data.postId,
                        "storeId":data.storeId,
                        "storeName":data.storeName,
                        "firstName":data.firstName,
                        "lastName":data.lastName
                    }

                };

                note.aps['content-available'] = 1;

                let deviceToken = data.deviceToken;
                // console.log("note",note)

                // console.log("deviceToken",deviceToken)
                apnProvider.send(note,deviceToken).then( (success) => {
                    if(success) {
                        console.log("from success",success.failed)
                        return resolve(success);
                    }
                });

            } catch(err) {
                console.log("Push Notification error", err);
                return reject({message: err, status: 0 });
            }

        });
  }

}

module.exports = PushNotification;