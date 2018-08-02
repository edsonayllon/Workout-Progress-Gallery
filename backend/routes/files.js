var express = require('express');
var router = express.Router();

//files
const fs = require('fs');

let directory = "/../public/images";
let files = fs.readdirSync(__dirname + directory);

/* GET image listing. */
router.get('/', function(req, res, next) {
  res.json(files);
});

module.exports = router;
