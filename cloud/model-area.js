/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var Warning = require('cloud/model-warning.js');
var Forecast = require('cloud/util-forecast.js');

var Area = Parse.Object.extend("Area", {
  // Instance methods
  setAttributesNeededByPush: function (newForecast, warningType) {
    var currentForecast = this.get(warningType + 'WarningForecast');

    this.set(warningType + 'NewHighestForecastLevel', Forecast.highestForecastLevel(newForecast));
    if (!this.has(warningType + 'HighestForecastLevel')) {
      this.set(warningType + 'HighestForecastLevel', Forecast.highestForecastLevel(newForecast));
    }

    if (this.has('regionId')) {
      this.set("highestPriorityAvalancheProblemHasChanged",
               Forecast.highestPriorityAvalancheProblemHasChanged(currentForecast, newForecast));
    } else if (this.has('municipalityId')) {
      this.set(warningType + "MicroBlogPostsHaveChanged",
               Forecast.microBlogPostsHaveChanged(currentForecast, newForecast));
    }
  },
  updateForecast: function (newForecast, warningType) {
    var currentForecast = this.get(warningType + 'WarningForecast');
    this.set(warningType + 'WarningForecast', Forecast.mergeForecastWithNewForecast(currentForecast, newForecast));
  }
}, {
  // Class methods
  getAreaWithId: function (areaId, warningType) {
    var query = new Parse.Query(this);
    query.equalTo(this.getIdAttribute());
    query.include(warningType + 'WarningForecast');
    return query.first();
  }
});

var Region = Area.extend('AvalancheRegion', {
  getIdAttribute: function () {
    return 'regionId';
  }
});

var County = Area.extend('County', {
  getIdAttribute: function () {
    return 'countyId';
  }
});

var Municipality = Area.extend('Municipality', {
  getIdAttribute: function () {
    return 'municipalityId';
  }
});

module.exports = {
  getAreaWithId: function (areaId, areaType, warningType) {
    if ('region' === areaType) {
      return Region.getAreaWithId(areaId, warningType);
    } else if ('county' === areaType) {
      return County.getAreaWithId(areaId, warningType);
    } else if ('municipality' === areaType) {
      return Municipality.getAreaWithId(areaId, warningType);
    } else {
      console.error("Incorrect areaType: " + areaType);
      return undefined;
    }
  }
};
