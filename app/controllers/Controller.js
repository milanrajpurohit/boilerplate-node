/****************************
 REQUEST PARAM SET CONTROLLER
 ****************************/
class Controller {

    boot(req, res) {
        this.req = req;
        this.res = res;
        return this;
    }

}

module.exports = Controller;