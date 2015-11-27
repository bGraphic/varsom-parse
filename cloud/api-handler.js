/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

function apiUrl(warningType) {
  return Parse.Config.get().then(function (config) {
    var apiUrl = config.get(warningType + "ApiUrl");
    if (apiUrl) {
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
    console.log("API: Data fetched for " + url);
    return result.data;
  }).fail(function (error) {
    console.error("API: Error - " + JSON.stringify(error));
    return Parse.Promise.error("API: Error for " + url);
  });
}

function fetchWarningsJsonForWarningType(warningType) {
  return apiUrl(warningType).then(function (url) {
    return fetchDataFromUrl(url).done(function (data) {
      if ('Avalanche' === warningType) {
        return Parse.Promise.as(data);
      } else {
        return Parse.Promise.as(data.CountyList);
      }
    });
  });
}

module.exports = {
  fetchWarnings: function (warningType) {
    return fetchWarningsJsonForWarningType(warningType);
  }
};
