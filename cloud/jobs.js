/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

var municipalityImporter = require('cloud/importer-municipalities.js');
var countyImporter = require('cloud/importer-counties.js');
var regionImporter = require('cloud/importer-regions.js');

var warningsImporter = require('cloud/importer-warnings.js');

function errorMessageFromErrorObject(error) {
    var errorMessage = "";

    if (!error) {
        return "No error message";
    }

    if (error.code === Parse.Error.AGGREGATE_ERROR || (error instanceof Array)) {
        _.each(error.errors, function (error) {
            errorMessage = errorMessage + "\n " + error.code + ": " + error.message;
        });
    } else if (error.message) {
        errorMessage = errorMessage + "\n " + error.code + ": " + error.message;
    } else {
        errorMessage = JSON.stringify(error);
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
        status.success('Avalanche import succeeded.');
    }, function (error) {
        status.error('Avalanche import failed: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importFloodWarnings", function (request, status) {
    warningsImporter.importFloodWarnings(request.params.countyLimit).then(function () {
        status.success('Import flood succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importLandSlideWarnings", function (request, status) {
    warningsImporter.importLandSlideWarnings(request.params.countyLimit).then(function () {
        status.success('Import landslide succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});

Parse.Cloud.job("importWarnings", function (request, status) {
    var promises = [];
    promises.push(warningsImporter.importAvalancheWarnings());
    promises.push(warningsImporter.importFloodWarnings(request.params.countyLimit));
    promises.push(warningsImporter.importLandSlideWarnings(request.params.countyLimit));

    Parse.Promise.when(promises).then(function (success) {
        status.success('Import all warnings succeeded.');
    }, function (error) {
        status.error('Import failed with error: ' + errorMessageFromErrorObject(error));
    });
});
