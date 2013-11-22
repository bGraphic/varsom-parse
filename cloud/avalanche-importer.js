/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var config = require('cloud/config.js');
var avlancheJSONParser = require('cloud/avalanche-json-parser.js');

function importAvalancheWarnings() {

    var regionAvalancheSummariesJSON = {};

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.avalanche + '/RegionSummary/Detail/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        regionAvalancheSummariesJSON = httpResponse.data;
        return avlancheJSONParser.regionSummariesJSONToRegions(regionAvalancheSummariesJSON);
    }).then(function (newAvalancheRegions) {
        return avlancheJSONParser.createOrUpdateAvalancheRegions(newAvalancheRegions);
    }).then(function (avalancheRegions) {
        return avlancheJSONParser.regionSummariesJSONToWarnings(regionAvalancheSummariesJSON);
    }).then(function (newAvalacheWarnings) {
        return avlancheJSONParser.createOrUpdateAvalancheWarnings(newAvalacheWarnings);
    }).then(function (avalancheWarnings) {
        return Parse.Promise.as('Avalanche warnings import finished successfully');
    }, function (error) {

        var errorMessage = "Avalanche warning import failed with error: ";

        if (error.code === Parse.Error.AGGREGATE_ERROR) {
            _.each(error.errors, function (error) {
                errorMessage += "\n " + JSON.parse(error);
            });
        } else {
            errorMessage += "\n " + JSON.parse(error);
        }

        return Parse.Promise.error(errorMessage);
    });
}

module.exports = {
    importAvalancheWarnings: importAvalancheWarnings
};
