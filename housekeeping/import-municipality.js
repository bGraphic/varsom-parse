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

var municipalityQuery = new Parse.Query('Municipality');
municipalityQuery.limit(1000);
municipalityQuery.find().then(function (municipalities) {

    var promises = Parse.Promise.as();

    var municipalitiesJSON = require('../data/kommuner.json').features;

    _.each(municipalitiesJSON, function (municipalityJSON) {

        var municipalityId = municipalityJSON.properties.komm;

        if (municipalityId < 1000) {
            municipalityId = "0" + municipalityId;
        } else if (municipalityId === 1903) {
            municipalityId = "1901";
        } else {
            municipalityId = municipalityId.toString();
        }

        var municipality = _.find(municipalities, function (municipality) {
            return municipality.get('municipalityId') === municipalityId;
        });

        if (!municipality) {
            console.log(municipalityId + " not found in parse");
        } else {
            var base64 = new Buffer(JSON.stringify(municipalityJSON.geometry)).toString('base64');
            var coordinatesFile = new Parse.File(municipalityId + ".geojson", { base64: base64});

            promises = promises.then(function () {
                return coordinatesFile.save();
            }).then(function (file) {
                console.log(file.name() + " saved");
                municipality.set('geoJSON', file);
                return municipality.save();
            });
        }
    });

    return promises;

}).then(function () {
    console.log("Coordinates saved");
}, function (error) {
    console.log("Coordinates did not all save " + JSON.stringify(error));
});
