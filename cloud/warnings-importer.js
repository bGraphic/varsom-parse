/*jslint node: true, nomen: true, vars: true, laxbreak: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var apiHandler = require('cloud/nve-warnings-api-handler.js');
var deserializer = require('cloud/warnings-deserializer.js');
var processor = require('cloud/warnings-processor.js');
var AvalancheWarning = require('cloud/model-warning-avalanche.js');
var AvalancheRegion = require('cloud/model-region.js');

function importFloodWarnings(countyLimit) {
    return apiHandler.fetchFloodWarnings(countyLimit).then(function (json) {
        console.log("Flood: json fetched");
        return deserializer.deserializeFloodWarnings(json, {
            countyProcessor: processor.processFloodWarningsForCounty,
            municipalityProcessor: processor.processFloodWarningsForMunicipality
        }, countyLimit);
    }).then(function () {
        console.log('Finished importing flood warnings');
        return Parse.Promise.as();
    }, function (error) {
        console.error("Flood: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Flood: try again");
            return importFloodWarnings();
        } else {
            console.log("Flood: do not try again");
            return Parse.Promise.error(error);
        }
    });
}

function importLandSlideWarnings(countyLimit) {
    return apiHandler.fetchLandSlideWarnings().then(function (json) {
        console.log("Landslide: json fetched");
        return deserializer.deserializeLandSlideWarnings(json, {
            countyProcessor: processor.processLandSlideWarningsForCounty,
            municipalityProcessor: processor.processLandSlideWarningsForMunicipality
        }, countyLimit);
    }).then(function () {
        console.log('Finished importing landslide warnings');
        return Parse.Promise.as();
    }, function (error) {
        console.error("Landslide: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Landslide: try again");
            return importLandSlideWarnings();
        } else {
            console.log("Landslide: do not try again");
            return Parse.Promise.error(error);
        }
    });
}

function importAvalancheWarnings() {
    return apiHandler.fetchAvalancheWarnings().then(function (json) {
      var promises = [];

      _.each(json, function (regionJson) {
        var regionId = regionJson.Id;

        var regionForecast = _.map(regionJson.AvalancheWarningList, function (warningJSON) {
          var warning = new AvalancheWarning();
          warning.set('regionId', regionId);
          warning.updateAttributesFromWarningJson(warningJSON);
          return warning;
        });

        promises.push(AvalancheRegion.queryForRegionWithId(regionId).done(function (region) {
          if (region) {
            region.setAttributesNeededByPush(regionForecast, 'AvalancheWarning');
            region.udpdateForecast(regionForecast, 'AvalancheWarning');
            return region.save();
          } else {
            console.error("Avalanche: no region with id=" + regionId);
            return Parse.Promise.as();
          }
        }));
      });

      return Parse.Promise.when(promises);

    }).fail(function (error) {
        console.error("Avalanche: import failed - " + JSON.stringify(error));
        if (error.code === 100) {
            console.log("Avalanche: try again");
            return importAvalancheWarnings();
        } else {
            console.log("Avalanche: do not try again");
            return Parse.Promise.error(error);
        }
    });
}

function importAllWarnings() {
    return Parse.Promise.when([
        importAvalancheWarnings(),
        importFloodWarnings(),
        importLandSlideWarnings()
    ]);
}

module.exports = {
    importFloodWarnings: importFloodWarnings,
    importLandSlideWarnings: importLandSlideWarnings,
    importAvalancheWarnings: importAvalancheWarnings,
    importAllWarning: importAllWarnings
};
