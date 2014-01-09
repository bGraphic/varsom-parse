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
        console.log("Flood: json fetched");
        return floodWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    }).then(function () {
        console.log("Flood: json imported");
        return Parse.Promise.as();
    }, function (error) {
        console.error("Flood: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Flood: try again");
            return importFloodWarnings();
        } else {
            console.log("Avalanche: do not try again");
            return Parse.Promise.as();
        }
    });
}

function importLandSlideWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.landSlide + '/CountySummary/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log("Landslide: json fetched");
        return landSlideWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    }).then(function () {
        console.log("Landslide: json imported");
        return Parse.Promise.as();
    }, function (error) {
        console.error("Landslide: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Landslide: try again");
            return importLandSlideWarnings();
        } else {
            console.log("Avalanche: do not try again");
            return Parse.Promise.as();
        }
    });
}

function importAvalancheWarnings() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.avalanche + '/RegionSummary/Detail/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        console.log("Avalanche: json fetched");
        return avalancheWarningsJSONParser.warningsJSONToWarnings(httpResponse.data);
    }).then(function () {
        console.log("Avalanche: json imported");
        return Parse.Promise.as();
    }, function (error) {
        console.error("Avalanche: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Avalanche: try again");
            return importLandSlideWarnings();
        } else {
            console.log("Avalanche: do not try again");
            return Parse.Promise.as();
        }
    });
}

function importAllWarnings() {
    return Parse.Promise.as().then(function () {
        return importAvalancheWarnings();
    }).then(function () {
        return importLandSlideWarnings();
    }).then(function () {
        return importFloodWarnings();
    });
}

module.exports = {
    importFloodWarnings: importFloodWarnings,
    importLandSlideWarnings: importLandSlideWarnings,
    importAvalancheWarnings: importAvalancheWarnings,
    importAllWarning: importAllWarnings
};
