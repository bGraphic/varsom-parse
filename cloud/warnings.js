/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var pushNotifier = require('cloud/push-notifier.js'),
    AVALANCHE_WARNING_TYPE = 'AvalancheWarning',
    FLOOD_WARNING_TYPE = 'FloodWarning',
    LANDSLIDE_WARNING_TYPE = 'LandSlideWarning';

Parse.Cloud.afterSave(AVALANCHE_WARNING_TYPE, function (request) {
    pushNotifier.pushWarningUpdate(AVALANCHE_WARNING_TYPE, request.object);
});

Parse.Cloud.afterSave(FLOOD_WARNING_TYPE, function (request) {
    pushNotifier.pushWarningUpdate(FLOOD_WARNING_TYPE, request.object);
});

Parse.Cloud.afterSave(LANDSLIDE_WARNING_TYPE, function (request) {
    pushNotifier.pushWarningUpdate(LANDSLIDE_WARNING_TYPE, request.object);
});