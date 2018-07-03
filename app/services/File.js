/****************************
 FILE HANDLING OPERATIONS
 ****************************/
let fs = require('fs');
let path = require('path');
let im = require('imagemagick');
const config = require('../../configs/configs');
let thumb = require('node-thumbnail').thumb;

class File {

    constructor(file, location) {
        this.file = file;
        this.location = location;
    }

    // Method to Generate file thumbnail
    generateThumbnail(file) {

        return new Promise((resolve, reject) => {

            let uploadedThumbnailFilePath = appRoot + '/public/uploads/';
            let srcFilePath = appRoot + file.srcPath;

            // Method to generate thumbnail
            thumb({
                source: srcFilePath, // could be a filename: dest/path/image.jpg
                destination: uploadedThumbnailFilePath,
                concurrency: 4,
                width: 200,
            }, function(files, err, stdout, stderr) {
                console.log('All done!', files, "err", err);
                let thumbnail = files[0].dstPath.split("/public");
                let thumbnailPartialPath = '/public' + thumbnail[1];
                return resolve(thumbnailPartialPath);
            });


        });

    }

    // Method to Store file
    store() {

        return new Promise((resolve, reject) => {
            // Setting the path
            let appDir = path.dirname(require.main.filename);
            let fileName = this.file.file[0].originalFilename.split(".");
            let filePath = '/public/uploads/'+ fileName[0] + Date.now().toString() + '.' + fileName[1];
            let uploadedFilePath = appRoot + filePath;
            let fileObject = {"originalFilename": this.file.file[0].originalFilename, "filePath": uploadedFilePath, "filePartialPath": filePath}

            // Method to write the file on server
            fs.readFile(this.file.file[0].path, (err, data) => {
                fs.writeFile(uploadedFilePath, data, (err) => {
                    if (err) { return reject({message: err, status: 0 }); }

                    return resolve(fileObject);
                });
            });

        });

    }
}

module.exports = File;