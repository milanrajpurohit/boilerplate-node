/****************************
 EMAIL HANDLING OPERATIONS
 ****************************/
let mail = require('nodemailer').mail;

class Email {

    constructor(email) {
        this.email = email;
    }

    // Method to send mail
    send() {
        return new Promise((resolve, reject) => {

            mail({
                from: '"Quickee" <support@quickee.com>', // sender address
                to: this.email.address, // list of receivers
                subject: this.email.subject, // Subject line
                text: this.email.text, // plain text body
                html: this.email.html  // html body
            });

            return resolve();

        });
    }
}

module.exports = Email;