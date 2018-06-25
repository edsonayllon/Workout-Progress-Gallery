/*
//requiring path and fs modules
var path = require(‘path’);
var fs = require(‘fs’);
//joining path of directory
var directoryPath = path.join(__dirname, '/public/images/gallery-images');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
//handling error
if (err) {
  return console.log(‘Unable to scan directory: ‘ + err);
}
//listing all files using forEach
files.forEach(function (file) {
// Do whatever you want to do with the file
console.log(file);
});
});


print(files);
*/
