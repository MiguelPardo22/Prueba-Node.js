const express = require('express');
const router = express.Router();
const informationController = require("./Controllers/InformationController");

router.post("/upload", informationController.upload.single('pdf'), (request, response) => {
    informationController.information(request, response);
});

router.post("/generate-csv", informationController.upload.single('pdf'), (request, response) => {
    informationController.generateCsv(request, response);
});

module.exports = router;