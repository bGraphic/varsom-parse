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

var warningType = process.argv[3];
if (!warningType) {
    warningType = 'FloodWarning';
}

var ParseAppKeys = Globals.applications[env];

Parse.initialize(ParseAppKeys.applicationId, ParseAppKeys.javascriptKey, ParseAppKeys.masterKey);

var warningQuery = new Parse.Query(warningType);
warningQuery.limit(1000);
warningQuery.find().then(function (warnings) {
    var promises = [];

    _.each(warnings, function (warning) {
        var validFrom = warning.get('validFrom');
        validFrom.setDate(validFrom.getDate() + 4);

        var validTo = warning.get('validTo');
        validTo.setDate(validTo.getDate() + 4);

        warning.set('validFrom', validFrom);
        warning.set('validTo', validTo);

        promises.push(warning.save());
    });

    return Parse.Promise.when(promises);
}).then(function () {
    console.log("Warnings save succeeded");
}, function (error) {
    console.log("Warnings save failed because of " + error.message);
});
