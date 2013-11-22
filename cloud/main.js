/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function (request, response) {
    response.success("Hello world!");
});

require('cloud/jobs.js');
require('cloud/county-jobs.js');

function addMunicipalityObjectToWarning(warning) {
    var municipalityQuery = new Parse.Query('Municipality');
    municipalityQuery.equalTo('municipalityId', warning.get('municipalityId'));
    municipalityQuery.first().then(function (municipality) {
        if (municipality && (!warning.get('municipality') || warning.get('municipality').id !== municipality.id)) {
            warning.set('municipality', municipality);
            warning.save();
        }
    }, function (error) {
        console.log(error);
    });
}

function addRegionObjectToWarning(warning) {
    var regionQuery = new Parse.Query('AvalancheRegion');
    regionQuery.equalTo('regionId', warning.get('regionId'));
    regionQuery.first().then(function (region) {
        if (region && (!warning.get('region') || warning.get('region').id !== region.id)) {
            warning.set('region', region);
            warning.save();
        }
    }, function (error) {
        console.log(error);
    });
}

function addCountyObjectToMunicipality(municipality) {
    var countyQuery = new Parse.Query('County');
    countyQuery.equalTo('countyId', municipality.get('countyId'));
    countyQuery.first().then(function (county) {
        if (county && (!municipality.get('county') || municipality.get('county').id !== county.id)) {
            municipality.set('county', county);
            municipality.save();
        }
    }, function (error) {
        console.log(error);
    });
}

Parse.Cloud.afterSave("AvalancheWarning", function (request) {
    addRegionObjectToWarning(request.object);
});

Parse.Cloud.afterSave("FloodWarning", function (request) {
    addMunicipalityObjectToWarning(request.object);
});

Parse.Cloud.afterSave("LandSlideWarning", function (request) {
    addMunicipalityObjectToWarning(request.object);
});

Parse.Cloud.afterSave("Municipality", function (request) {
    addCountyObjectToMunicipality(request.object);
});
