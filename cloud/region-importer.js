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

        _.each(newRegions, function (newRegion) {
            var region = _.find(regions, function (region) {
                return region.get('regionId') === newRegion.get('regionId');
            });

            if (!region) {
                region = newRegion;
                console.log("Create region: " + region.get("regionId"));
            } else {
                region = updateRegion(region, newRegion);
                console.log("Update region: " + region.get("regionId"));
            }

            region = setRegionRegOpsUrl(region);

            if(region.get('regionId') != 20)
              promises.push(region.save());
            else
              console.log("Do not save region: 20, Nordfjord");
        });

        return Parse.Promise.when(promises);
    });
}

function deleteRegions(newRegions) {
    var regionQuery = new Parse.Query('AvalancheRegion');

    return regionQuery.find().then(function (regions) {

        var promises = [];

        _.each(regions, function (region) {
            var newRegion = _.find(newRegions, function (newRegion) {
                return region.get('regionId') === newRegion.get('regionId');
            });

            if (!newRegion) {
                promises.push(region.destroy());
                console.log("Delete region: " + region.get("regionId"));
            }
        });

        var region20 = _.find(regions, function (region) {
            return region.get('regionId') == 20;
        });

        if (region20) {
            promises.push(region20.destroy());
            console.log("Delete region: 20 Nordfjord: ");
        }

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
        return Parse.Promise.when(createOrUpdateRegions(newRegions), deleteRegions(newRegions));
    }).then(function () {
        return Parse.Promise.as('Regions import finished successfully');
    });
}

module.exports = {
    importRegions: importRegions
};
