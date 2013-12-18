/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

var municipalityImporter = require('cloud/municipality-importer.js');
var countyImporter = require('cloud/county-importer.js');
var regionImporter = require('cloud/region-importer.js');

var warningsImporter = require('cloud/warnings-importer.js');

function errorMessageFromErrorObject(error) {
    var errorMessage = "";

    if (error.code === Parse.Error.AGGREGATE_ERROR) {
        _.each(error.errors, function (error) {
            errorMessage = errorMessage + "\n " + error.message;
        });
    } else {
        errorMessage = errorMessage + "\n " + error.message;
    }

    return errorMessage;
}

Parse.Cloud.job("importRegions", function (request, status) {
    regionImporter.importRegions().then(function () {
        status.success('Import regions succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importMunicipalities", function (request, status) {
    municipalityImporter.importMunicipalities().then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importCounties", function (request, status) {
    countyImporter.importCounties().then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importAvalancheWarnings", function (request, status) {
    warningsImporter.importAvalancheWarnings(status).then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importFloodWarnings", function (request, status) {
    warningsImporter.importFloodWarnings().then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importLandSlideWarnings", function (request, status) {
    warningsImporter.importLandSlideWarnings().then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importWarnings", function (request, status) {
    warningsImporter.importLandSlideWarnings().then(function (success) {
        return warningsImporter.importFloodWarnings();
    }).then(function () {
        return warningsImporter.importAvalancheWarnings();
    }).then(function () {
        status.success('Import succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});
