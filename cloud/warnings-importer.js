/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var config = require('cloud/config.js');
var floodWarningsJSONParser = require('cloud/warnings-json-parser.js').floodWarningsJSONParser;
var landSlideWarningsJSONParser = require('cloud/warnings-json-parser.js').landSlideWarningsJSONParser;
var avalancheWarningsJSONParser = require('cloud/avalanche-json-parser.js');

function errorMessageFromErrorObject(error) {
    var errorMessage = "";

    if (error.code === Parse.Error.AGGREGATE_ERROR) {
        _.each(error.errors, function (error) {
            errorMessage += "\n " + JSON.parse(error);
        });
    } else {
        errorMessage += "\n " + JSON.parse(error);
    }

    return errorMessage;
}

function importWarningsFromCountyOverviewJSON(countyOverviewJSON, warningImporter) {
    console.log(warningImporter.warningType + ' - started importing');
    var newWarnings = warningImporter.countyOverviewJSONToWarnings(countyOverviewJSON);

    return warningImporter.createOrUpdateWarnings(newWarnings).then(function (warnings) {
        console.log(warningImporter.warningType + ' - warnings imported');
        return Parse.Promise.as(warningImporter.warningType + ' - import from county overview finished successfully');

    }, function (error) {

        var errorMessage = warningImporter.warningType + ' - import from county overview failed with error: ';
        errorMessage += errorMessageFromErrorObject(error);

        return Parse.Promise.error(errorMessage);

    });
}

function importWarningsFromMunicipalityListJSON(municipalityListJSON, warningImporter) {
    console.log(warningImporter.warningType + ' - started importing');
    var newWarnings = warningImporter.municipalityWarningListJSONToWarnings(municipalityListJSON);

    return warningImporter.createOrUpdateWarnings(newWarnings).then(function (warnings) {
        console.log(warningImporter.warningType + ' - warnings imported');
        return Parse.Promise.as(warningImporter.warningType + ' - import from municipality list finished successfully');

    }, function (error) {

        var errorMessage = warningImporter.warningType + ' - import from municipality list failed with error: ';
        errorMessage += errorMessageFromErrorObject(error);

        return Parse.Promise.error(errorMessage);

    });
}

function importAvalancheRegionsAndWarningsFromRegionJSON(regionSummaryJSON, avalancheImporter) {
    console.log('Avalanche - started importing');
    var newRegions = avalancheImporter.regionSummariesJSONToRegions(regionSummaryJSON);

    return avalancheImporter.createOrUpdateAvalancheRegions(newRegions).then(function (regions) {
        console.log('Avalanche - regions imported');
        var newWarnings = avalancheImporter.regionSummariesJSONToWarnings(regionSummaryJSON);
        return avalancheImporter.createOrUpdateAvalancheWarnings(newWarnings);

    }).then(function (warnings) {
        console.log('Avalanche - warnings imported');
        return Parse.Promise.as('AvalancheWarning  - import from region summary finished successfully');

    }, function (error) {

        var errorMessage = 'AvalancheWarning - import from regionn summary failed with error: ';
        errorMessage += errorMessageFromErrorObject(error);

        return Parse.Promise.error(errorMessage);

    });

}

function importFloodWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.flood + '/CountyOverview/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log('Flood httpResponse ' + httpResponse.status);
        return importWarningsFromCountyOverviewJSON(httpResponse.data, floodWarningsJSONParser);
    }, function (httpResponse) {
        console.log('Flood httpResponse ' + httpResponse.status);
        return Parse.Promise.error("FloodWarning - could not import from county overview: " + httpResponse.status);
    });
}

function importFloodWarningsForAMunicipality(municipalityId) {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.flood + '/WarningByMunicipality/' + municipalityId + '/1/',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log('Flood httpResponse ' + httpResponse.status);
        return importWarningsFromMunicipalityListJSON(httpResponse.data, floodWarningsJSONParser);
    }, function (httpResponse) {
        console.log('Flood httpResponse ' + httpResponse.status);
        return Parse.Promise.error("FloodWarning - could not import from municipality list: " + httpResponse.status);
    });
}

function importLandSlideWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.landSlide + '/CountyOverview/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log('LandSlide httpResponse ' + httpResponse.status);
        return importWarningsFromCountyOverviewJSON(httpResponse.data, landSlideWarningsJSONParser);
    }, function (httpResponse) {
        console.log('LandSlide httpResponse ' + httpResponse.status);
        return Parse.Promise.error("LandSlideWarning - could not import from county overview: " + httpResponse.status);
    });
}

function importAvalancheWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.avalanche + '/RegionSummary/Detail/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log('Avalanche httpResponse ' + httpResponse.status);
        return importAvalancheRegionsAndWarningsFromRegionJSON(httpResponse.data, avalancheWarningsJSONParser);
    }, function (httpResponse) {
        console.log('Avalanche httpResponse ' + httpResponse.status);
        return Parse.Promise.error("Avalanche - could not import from county overview: " + httpResponse.status);
    });
}

module.exports = {
    importFloodWarnings: importFloodWarnings,
    importFloodWarningsForAMunicipality: importFloodWarningsForAMunicipality,
    importLandSlideWarnings: importLandSlideWarnings,
    importAvalancheWarnings: importAvalancheWarnings
};
