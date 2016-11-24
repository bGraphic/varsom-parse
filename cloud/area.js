/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var pushNotifier = require('cloud/push-notifier.js');

Parse.Cloud.beforeSave('County', function (request, response) {
  pushNotifier.pushHighestForecastLevelUpdate(request.object, 'LandSlide').then(function () {
    return pushNotifier.pushHighestForecastLevelUpdate(request.object, 'Flood');
  }).then(function () {
    return response.success();
  }, function (error) {
    return response.success();
  });
});

Parse.Cloud.beforeSave('Municipality', function (request, response) {
  pushNotifier.pushHighestForecastLevelUpdate(request.object, 'LandSlide').then(function () {
    return pushNotifier.pushHighestForecastLevelUpdate(request.object, 'Flood');
  }).then(function () {
    return pushNotifier.pushMicroBlogPostsUpdate(request.object, 'LandSlide');
  }).then(function () {
    return pushNotifier.pushMicroBlogPostsUpdate(request.object, 'Flood');
  }).then(function () {
    return response.success();
  }, function (error) {
    return response.success();
  });
});

Parse.Cloud.beforeSave('AvalancheRegion', function (request, response) {
  pushNotifier.pushHighestForecastLevelUpdate(request.object, 'Avalanche')
    .always(function () {
      return pushNotifier.pushHighestPriorityAvalancheProblemHasChangedUpdate(request.object);
    })
    .always(function () {
      return response.success();
    });
});
