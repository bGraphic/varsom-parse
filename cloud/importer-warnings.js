/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var _ = require('underscore');
var apiHandler = require('cloud/api-handler.js');
var Warning = require('cloud/model-warning.js');
var Area = require('cloud/model-area.js');
var Forecast = require('cloud/util-forecast.js');

function findAndUpdateAreaWithForecast(areaId, forecast, areaType, warningType) {
  return Area.getAreaWithId(areaId, areaType, warningType).done(function (area) {
    if (area) {
      area.setAttributesNeededByPush(forecast, warningType);
      area.updateForecast(forecast, warningType);
      return area.save();
    } else {
      console.error(warningType + ": no " + areaType + " with id=" + areaId + " in Parse");
      return Parse.Promise.as();
    }
  });
}

function loopThroughRegions(json, warningType) {
  var promises = [];

  _.each(json, function (regionJson) {
    var regionId = regionJson.Id;

    var regionForecast = _.map(regionJson.AvalancheWarningList, function (warningJson) {
      var warning = Warning.newWarning(warningType);
      warning.set('regionId', regionId);
      warning.updateAttributesFromWarningJson(warningJson);
      return warning;
    });

    promises.push(findAndUpdateAreaWithForecast(regionId, regionForecast, 'region', warningType));
  });

  return promises;
}

function loopThroughCounties(json, warningType) {
  var promises = [];

  _.each(json, function (countyJson) {
    var countyId = countyJson.Id;
    var countyForecast = [];

    _.each(countyJson.MunicipalityList, function (municipalityJson) {
      var municipalityId = municipalityJson.Id;
      var municipalityForecast = _.map(municipalityJson.WarningList, function (warningJson) {
        var warning = Warning.newWarning(warningType);
        warning.set('countyId', countyId);
        warning.set('municipalityId', municipalityId);
        warning.updateAttributesFromWarningJson(warningJson);
        return warning;
      });

      countyForecast = Forecast.updateForecastIfNewForecastHasHigherLevel(countyForecast, municipalityForecast);
      promises.push(findAndUpdateAreaWithForecast(municipalityId, municipalityForecast, 'municipality', warningType));

    });

    promises.push(findAndUpdateAreaWithForecast(countyId, countyForecast, 'county', warningType));
  });

  return promises;
}


function importWarnings(warningType, countyLimit) {

  return apiHandler.fetchWarnings(warningType).then(function (json) {
    var promises = [];

    if (countyLimit && countyLimit.breakPoint) {
      var index1 = 0;
      var index2 = countyLimit.breakPoint;
      if (countyLimit.importAboveBreakPoint) {
        index1 = countyLimit.breakPoint;
        index2 = json.length+1;
      }
      json = json.slice(index1, index2);
    }

    if ('Avalanche' === warningType) {
      promises = loopThroughRegions(json, warningType);
    } else {
      promises = loopThroughCounties(json, warningType);
    }

    return Parse.Promise.when(promises);

  }).fail(function (error) {
    console.error(warningType + ": import failed - " + JSON.stringify(error));
    if (error.code === 100) {
      console.log(warningType + ":  try again");
      return importWarnings(warningType);
    } else {
      console.log(warningType + ": do not try again");
      return Parse.Promise.error(error);
    }
  });
}

module.exports = {
  importFloodWarnings: function (countyLimit) {
    return importWarnings('Flood', countyLimit);
  },
  importLandSlideWarnings: function (countyLimit) {
    return importWarnings('LandSlide', countyLimit);
  },
  importAvalancheWarnings: function () {
    return importWarnings('Avalanche');
  }
};
