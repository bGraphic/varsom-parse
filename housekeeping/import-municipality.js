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

    var municipalitiesJSON = require('../data/kommuner.json').features;

    var multiPolygonCollection = {};

    _.each(municipalitiesJSON, function (municipalityJSON) {

        var municipalityId = municipalityJSON.properties.komm;
        var countyPolygonCoordinates = municipalityJSON.geometry.coordinates;

        if (!multiPolygonCollection[municipalityId]) {
            multiPolygonCollection[municipalityId] = {};
            multiPolygonCollection[municipalityId].type = "MultiPolygon";
            multiPolygonCollection[municipalityId].coordinates  = [countyPolygonCoordinates];
        } else {
            multiPolygonCollection[municipalityId].coordinates.push(countyPolygonCoordinates);
        }
    });

    console.log("# of geojson municipalities " + _.size(multiPolygonCollection));


    var promises = Parse.Promise.as();

    _.each(multiPolygonCollection, function (municipalityMultiPolygonJSON, municipalityId) {

        if (municipalityId < 1000) {
            municipalityId = "0" + municipalityId;
        } else if (municipalityId === 1903) {
            municipalityId = "1901";
        } else {
            municipalityId = municipalityId.toString();
        }

        console.log("Municipality: " + municipalityId + " | # of polygons: " + municipalityMultiPolygonJSON.coordinates.length);

        var municipality = _.find(municipalities, function (municipality) {
            return municipality.get('municipalityId') === municipalityId;
        });

        if (!municipality) {
            console.log(municipalityId + " not found in parse");
        } else {
            var base64 = new Buffer(JSON.stringify(municipalityMultiPolygonJSON)).toString('base64');
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
