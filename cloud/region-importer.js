/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var apiHandler = require('cloud/nve-warnings-api-handler.js');

function updateRegionWithJSON(region, regionJSON) {
    region.set('regionId', regionJSON.Id);
    region.set('name', regionJSON.Name);

    return region;
}

function updateRegion(region, newRegion) {
    region.set('name', newRegion.get('name'));
    return region;
}

function setRegionRegOpsUrl(region)
{
    var regionId = region.get('regionId');
    if(regionId < 10)
      regionId = "0" + regionId;

    region.set('regObsUrl', 'http://www.regobs.no/Search/Search?GeoHazard=10&SelectedTypes=-1&SelectedRegions=1'+regionId+'&SelectedPeriode=2');

    return region;
}

function createOrUpdateRegions(newRegions) {
    var regionQuery = new Parse.Query('AvalancheRegion');

    return regionQuery.find().then(function (regions) {

        var promises = [];

        _.each(newRegions, function (newregion) {
            var region = _.find(regions, function (region) {
                return region.get('regionId') === newregion.get('regionId');
            });

            if (!region) {
                region = newregion;
            } else {
                region = updateRegion(region, newregion);
            }

            region = setRegionRegOpsUrl(region);

            promises.push(region.save());

            console.log("Update/create region: " + region.get("regionId"));

        });

        return Parse.Promise.when(promises);
    });
}

function regionOverviewsJSONToRegions(regionOverviewsJSON) {
    var regions = [];

    _.each(regionOverviewsJSON, function (regionOverviewJSON) {
        var region = new Parse.Object('AvalancheRegion');
        regions.push(updateRegionWithJSON(region, regionOverviewJSON));
    });

    return regions;
}

function importRegions() {

    return apiHandler.fetchAvalancheWarnings().then(function (json) {
        return regionOverviewsJSONToRegions(json);
    }).then(function (newRegions) {
        return createOrUpdateRegions(newRegions);
    }).then(function (regions) {
        return Parse.Promise.as('Regions import finished successfully');
    });
}

module.exports = {
    importRegions: importRegions
};
