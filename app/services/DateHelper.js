/****************************
 DATE RELATED OPERATIONS
 ****************************/

class DateHelper {

    // Method to calculate time difference
    static calculateTimeDifference(date1, date2) {

        return new Promise((resolve, reject) => {

            let diff =(date1.getTime() - date2.getTime()) / 1000;
            diff /= 60;
            let hours = Math.abs(Math.round(diff));

            return resolve(hours);

        });
    }

    // Method to calculate Past Date
    static calculatePastDate(days) {

        return new Promise((resolve, reject) => {

            let newDate = new Date(new Date().setDate(new Date().getDate()-days));

            return resolve(newDate);

        });
    }

    // Method to calculate Past Date in YYYY-MM-DD
    static calculateFormattedPastDate(days) {

        return new Promise((resolve, reject) => {

            let newDate = new Date(new Date().setDate(new Date().getDate()-days));

            let dd = newDate.getDate();
            let mm = newDate.getMonth()+1;
            let yyyy = newDate.getFullYear();

            if(dd < 10)
            {
                dd = '0' + dd;
            }

            if(mm < 10)
            {
                mm = '0' + mm;
            }

            let customDate = new Date(yyyy+'-'+mm+'-'+dd)

            return resolve(customDate);

        });
    }
}

module.exports = DateHelper;