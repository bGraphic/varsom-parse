/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var Globals = require('../config/global.json');
var Parse = require('parse').Parse;

var _ = require('underscore');

var env = process.argv[2];
if (!env) {
    env = Globals.applications._default.link;
}

var ParseAppKeys = Globals.applications[env];

Parse.initialize(ParseAppKeys.applicationId, ParseAppKeys.javascriptKey, ParseAppKeys.masterKey);

var regionQuery = new Parse.Query('AvalancheRegion');
regionQuery.limit(1000);
regionQuery.find().then(function (regions) {

    var promises = Parse.Promise.as();

    var regionsJSON = require('../data/regioner.json').features;

    _.each(regionsJSON, function (regionJSON) {

        var regionId = regionJSON.properties.omraadeid;

        var region = _.find(regions, function (region) {
            return region.get('regionId') === regionId;
        });

        if (!region) {
            console.log(regionId + " not found in parse");
        } else {
            var base64 = new Buffer(JSON.stringify(regionJSON.geometry)).toString('base64');
            var coordinatesFile = new Parse.File(regionId + ".geojson", { base64: base64});

            promises = promises.then(function () {
                return coordinatesFile.save();
            }).then(function (file) {
                console.log(file.name() + " saved");
                region.set('geoJSON', file);
                return region.save();
            });
        }
    });

    return promises;

}).then(function () {
    console.log("Coordinates saved");
}, function (error) {
    console.log("Coordinates did not all save " + JSON.stringify(error));
});
