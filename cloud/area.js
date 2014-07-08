/*jslint node: true, nomen: true, vars: true, laxbreak: true */
/*global Parse, unescape */

'use strict';

var pushNotifier = require('cloud/push-notifier.js');

Parse.Cloud.beforeSave('County', function (request, response) {
    pushNotifier.pushHighestForecastLevelUpdate(request.object, 'LandSlideWarning').then(function() {
        return pushNotifier.pushHighestForecastLevelUpdate(request.object, 'FloodWarning');
    }).then(function() {
        return response.success();
    }, function(error) {
        return response.success();
    });
});

Parse.Cloud.beforeSave('Municipality', function (request, response) {
    pushNotifier.pushHighestForecastLevelUpdate(request.object, 'LandSlideWarning').then(function() {
        return pushNotifier.pushHighestForecastLevelUpdate(request.object, 'FloodWarning');
    }).then(function() {
        return response.success();
    }, function(error) {
        return response.success();
    });
});

Parse.Cloud.beforeSave('AvalancheRegion', function (request, response) {
    pushNotifier.pushHighestForecastLevelUpdate(request.object, 'AvalancheWarning')
    .then(function() {
        return response.success();
    }, function(error) {
        return response.success();
    });
});
