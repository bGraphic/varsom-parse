/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var apiHandler = require('cloud/nve-warnings-api-handler.js'),
    deserializer = require('cloud/warnings-deserializer.js'),
    processor = require('cloud/warnings-processor.js');

function importFloodWarnings() {
    return apiHandler.fetchFloodWarnings().then(function (json) {
        console.log("Flood: json fetched");
        return deserializer.deserializeFloodWarnings(json, {
            countyProcessor: processor.processFloodWarningsForCounty,
            municipalityProcessor: processor.processFloodWarningsForMunicipality
        });
    }).then(function () {
        console.log('Finished importing flood warnings');
    }, function (error) {
        console.error("Flood: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Flood: try again");
            return importFloodWarnings();
        } else {
            console.log("Flood: do not try again");
            return Parse.Promise.as();
        }
    });
}

function importLandSlideWarnings() {

    return apiHandler.fetchLandSlideWarnings().then(function (json) {
        console.log("Landslide: json fetched");
        return deserializer.deserializeLandSlideWarnings(json, {
            countyProcessor: processor.processLandSlideWarningsForCounty,
            municipalityProcessor: processor.processLandSlideWarningsForMunicipality
        });
    }).then(function () {
        console.log('Finished importing landslide warnings');
    }, function (error) {
        console.error("Flood: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Landslide: try again");
            return importLandSlideWarnings();
        } else {
            console.log("Landslide: do not try again");
            return Parse.Promise.as();
        }
    });
}

function importAvalancheWarnings() {
    return apiHandler.fetchAvalancheWarnings().then(function (json) {
        console.log("Avalanche: json fetched");
        return deserializer.deserializeAvalancheWarnings(json, processor.processAvalancheWarningsForRegion);
    }).then(function () {
        console.log("Avalanche: json imported");
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
