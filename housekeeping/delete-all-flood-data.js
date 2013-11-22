#! /usr/bin/env node

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

var floodWarningQuery = new Parse.Query("FloodWarning");
floodWarningQuery.limit(1000);
floodWarningQuery.find().then(function (floodWarnings) {
    Parse.Object.destroyAll(floodWarnings, function (success, error) {
        if (success) {
            console.log("All warnings deleted");
        } else {
          // An error occurred while deleting one or more of the objects.
          // If this is an aggregate error, then we can inspect each error
          // object individually to determine the reason why a particular
          // object was not deleted.
            if (error.code === Parse.Error.AGGREGATE_ERROR) {
                _.each(error.errors, function (error) {
                    console.log("Couldn't delete " + error.object.id + "due to " + error.message);
                });
            } else {
                console.log("Delete aborted because of " + error.message);
            }
        }
    });
}, function (error) {
    console.log("Warning query failed because of " + error.message);
});
