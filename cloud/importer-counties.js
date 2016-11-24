/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var apiHandler = require('cloud/api-handler.js');

function updateCountyWithJSON(county, countyJSON) {
  county.set('countyId', countyJSON.Id);
  county.set('name', countyJSON.Name);

  return county;
}

function updateCounty(county, newCounty) {
  county.set('name', newCounty.get('name'));
  return county;
}

function createOrUpdateCounties(newCounties) {
  var countyQuery = new Parse.Query('County');

  return countyQuery.find().then(function (counties) {

    var promises = [];

    _.each(newCounties, function (newCounty) {
      var county = _.find(counties, function (county) {
        return county.get('countyId') === newCounty.get('countyId');
      });

      if (!county) {
        county = newCounty;
      } else {
        county = updateCounty(county, newCounty);
      }

      console.log("Update/create county: " + county.get('countyId'));

      promises.push(county.save());

    });

    return Parse.Promise.when(promises);
  });
}

function countySummariesJSONToCounties(countySummariesJSON) {
  var counties = [];

  _.each(countySummariesJSON, function (countySummaryJSON) {
    var county = new Parse.Object('County');
    counties.push(updateCountyWithJSON(county, countySummaryJSON));
  });

  return counties;
}

function importCounties() {

  return apiHandler.fetchWarnings('Flood').then(function (json) {
    return countySummariesJSONToCounties(json);
  }).then(function (newCounties) {
    return createOrUpdateCounties(newCounties);
  }).then(function (counties) {
    return Parse.Promise.as('Counties import finished successfully');
  }, function (error) {
    return Parse.Promise.error('Counties import failed with error ' + error);
  });
}

module.exports = {
  importCounties: importCounties
};
