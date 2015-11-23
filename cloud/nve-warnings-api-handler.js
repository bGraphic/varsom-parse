/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var WARNING_TYPE_AVALANCHE = "avalanche";
var WARNING_TYPE_FLOOD = "flood";
var WARNING_TYPE_LANDSLIDE = "landslide";

function apiUrl(warningType) {
  return Parse.Config.get().then(function (config) {
    var apiUrl = config.get(warningType + "ApiUrl");
    if(apiUrl) {
      return apiUrl;
    } else {
      return Parse.Promise.error("Missing Parse.Config parameter: " + warningType + "ApiUrl");
    }
  });
}

function fetchDataFromUrl(url) {
  return Parse.Cloud.httpRequest({
    url: url,
    headers: {
      'Content-Type': 'application/json'
    }
  }).done(function (result) {
    return result.data;
  }).fail(function (error) {
    console.error("API Error: " + JSON.stringify(error));
    return Parse.Promise.error("API Error: " + url);
  });
}

function fetchWarningsJsonForWarningType(warningType) {
  return apiUrl(warningType).then(function (url) {
    return fetchDataFromUrl(url);
  });
}

module.exports = {
  fetchAvalancheWarnings: function () {
    return fetchWarningsJsonForWarningType(WARNING_TYPE_AVALANCHE);
  },
  fetchFloodWarnings: function () {
    return fetchWarningsJsonForWarningType(WARNING_TYPE_FLOOD);
  },
  fetchLandSlideWarnings: function () {
    return fetchWarningsJsonForWarningType(WARNING_TYPE_LANDSLIDE);
  }
};
