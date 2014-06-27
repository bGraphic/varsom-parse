/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var config = require('cloud/config.js'),
    AVALANCHE_WARNING_API_URL = config.api.urlBase.avalanche + '/RegionSummary/Detail/1',
    FLOOD_WARNING_API_URL = config.api.urlBase.flood + '/CountySummary/1',
    LANDSLIDE_WARNING_API_URL = config.api.urlBase.landSlide + '/CountySummary/1';

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
    return fetch(AVALANCHE_WARNING_API_URL);
}

function fetchFloodWarnings() {
    return fetch(FLOOD_WARNING_API_URL);
}

function fetchLandSlideWarnings() {
    return fetch(LANDSLIDE_WARNING_API_URL);
}

module.exports = {
    fetchAvalancheWarnings: fetchAvalancheWarnings,
    fetchFloodWarnings: fetchFloodWarnings,
    fetchLandSlideWarnings: fetchLandSlideWarnings
};
