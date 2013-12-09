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

var countyQuery = new Parse.Query('County');
countyQuery.limit(1000);
countyQuery.find().then(function (counties) {

    var promises = Parse.Promise.as();

    var countiesJSON = require('../data/fylker.json').features;
    console.log(countiesJSON.length);

    _.each(countiesJSON, function (countyJSON) {

        var countyId = countyJSON.properties.fylkesnr;

        if (countyId < 10) {
            countyId = "0" + countyId;
        } else {
            countyId = countyId.toString();
        }

        var county = _.find(counties, function (county) {
            return county.get('countyId') === countyId;
        });

        if (!county) {
            console.log(countyId + " not found in parse");
        } else {
            var base64 = new Buffer(JSON.stringify(countyJSON.geometry)).toString('base64');
            var coordinatesFile = new Parse.File(countyId + ".geojson", { base64: base64});

            promises = promises.then(function () {
                return coordinatesFile.save();
            }).then(function (file) {
                console.log(file.name() + " saved");
                county.set('geoJSON', file);
                return county.save();
            });
        }
    });

    return promises;

}).then(function () {
    console.log("Coordinates saved");
}, function (error) {
    console.log("Coordinates did not all save " + JSON.stringify(error));
});
