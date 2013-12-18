/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var config = require('cloud/config.js');
var floodWarningsJSONParser = require('cloud/warnings-json-parser.js').floodWarningsJSONParser;
var landSlideWarningsJSONParser = require('cloud/warnings-json-parser.js').landSlideWarningsJSONParser;
var avalancheWarningsJSONParser = require('cloud/avalanche-json-parser.js').avalancheWarningsJSONParser;

function importFloodWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.flood + '/CountySummary/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        return floodWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    });
}

function importLandSlideWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.landSlide + '/CountySummary/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        return landSlideWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    });
}

function importAvalancheWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.avalanche + '/RegionSummary/Detail/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        return avalancheWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    });
}

module.exports = {
    importFloodWarnings: importFloodWarnings,
    importLandSlideWarnings: importLandSlideWarnings,
    importAvalancheWarnings: importAvalancheWarnings
};
