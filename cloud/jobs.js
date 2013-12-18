/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

var municipalityImporter = require('cloud/municipality-importer.js');
var countyImporter = require('cloud/county-importer.js');

var warningsImporter = require('cloud/warnings-importer.js');

Parse.Cloud.job("importMunicipalities", function (request, status) {
    municipalityImporter.importMunicipalities().then(function (success) {
        status.success(success);
    }, function (error) {
        status.error(error);
    });
});

Parse.Cloud.job("importCounties", function (request, status) {
    countyImporter.importCounties().then(function (success) {
        status.success(success);
    }, function (error) {
        status.error(error);
    });
});

Parse.Cloud.job("importFloodWarnings", function (request, status) {
    warningsImporter.importFloodWarnings().then(function (success) {
        status.success(JSON.stringify(success));
    }, function (error) {
        status.error(error);
    });
});

Parse.Cloud.job("importLandSlideWarnings", function (request, status) {
    warningsImporter.importLandSlideWarnings().then(function (success) {
        status.success(JSON.stringify(success));
    }, function (error) {
        status.error(error);
    });
});

Parse.Cloud.job("importAvalancheWarnings", function (request, status) {
    warningsImporter.importAvalancheWarnings(status).then(function (success) {
        status.success(success);
    }, function (error) {
        status.error(error);
    });
});

Parse.Cloud.job("importWarnings", function (request, status) {
    warningsImporter.importLandSlideWarnings().then(function (success) {
        return warningsImporter.importFloodWarnings();
    }).then(function (success) {
        return warningsImporter.importAvalancheWarnings();
    }).then(function (success) {
        status.success('Import of landslide, flood and avalanche warnings succeeded.');
    }, function (error) {
        status.error(error);
    });
});
