/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var WARNING_TYPE_AVALANCHE = "avalanche";
var WARNING_TYPE_FLOOD = "flood";
var WARNING_TYPE_LANDSLIDE = "landslide";

function apiUrl(warningType) {
  return Parse.Config.get().then(function(config) {
    return config.get(warningType + "ApiUrl");
  });
}

function api(url) {
    return Parse.Cloud.httpRequest({
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

function fetch(url) {
    var promise = new Parse.Promise();

    api(url).then(function(result) {
        promise.resolve(result.data);
    }, function (error) {
        console.error("API Error: " + JSON.stringify(error));
        promise.reject(error);
    });

    return promise;
}

function fetchWarningsForWarningType(warningType) {
    return apiUrl(warningType).then(function (url) {
        return fetch(url);
    });
}

module.exports = {
    fetchAvalancheWarnings: function() {
      return fetchWarningsForWarningType(WARNING_TYPE_AVALANCHE);
    },
    fetchFloodWarnings: function() {
      return fetchWarningsForWarningType(WARNING_TYPE_FLOOD);
    },
    fetchLandSlideWarnings: function() {
      return fetchWarningsForWarningType(WARNING_TYPE_LANDSLIDE);
    },
};
