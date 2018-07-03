/****************************
 SERVER MAIN FILE
 ****************************/
process.env.NODE_ENV = process.env.NODE_ENV;

// Include Modules
let exp = require('express');
let config = require('./configs/configs');
let express = require('./configs/express');
let mongoose = require('./configs/mongoose');
let path = require('path');

global.appRoot = path.resolve(__dirname);

if (global.permission) {

} else {
	global.permission = [];
}

db = mongoose();
app = express();

/* Old path for serving public folder */
app.use('/', exp.static(__dirname + '/'));

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

// Listening Server
app.listen(config.serverPort , () => {
	console.log(`Server running at http://localhost:${config.serverPort}`);
});
