/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var config = require('cloud/config.js'),
    AVALANCHE_WARNING_API_PATH = '/RegionSummary/Detail/1',
    FLOOD_WARNING_API_PATH = '/CountySummary/1',
    LANDSLIDE_WARNING_API_PATH = '/CountySummary/1';

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

function fetchAvalancheWarnings() {
    return config.api.urlBase.avalanche().then(function (base) {
        return fetch(base + AVALANCHE_WARNING_API_PATH);
    });
}

function fetchFloodWarnings() {
    return config.api.urlBase.flood().then(function (base) {
        return fetch(base + FLOOD_WARNING_API_PATH);
    });
}

function fetchLandSlideWarnings() {
    return config.api.urlBase.landSlide().then(function (base) {
        return fetch(base + LANDSLIDE_WARNING_API_PATH);
    });
}

module.exports = {
    fetchAvalancheWarnings: fetchAvalancheWarnings,
    fetchFloodWarnings: fetchFloodWarnings,
    fetchLandSlideWarnings: fetchLandSlideWarnings
};
