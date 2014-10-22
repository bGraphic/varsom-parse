/*jslint node: true, nomen: true */
/*global Parse */

"use strict";

function apiVersion(type) {
    if (type === 'avalanche') {
        return 'v2.0.1';
    } else {
        return 'v1.0.2';
    }
}

function urlBase(type) {
    var base = 'http://api01.nve.no/hydrology/forecast/' + type + '/' + apiVersion(type) + '/api';

    return Parse.Config.get().then(function(config) {
        if (config.get(type + 'UseTestApi')) {
            base = 'http://h-web02.nve.no/' + type + '_test/api';
        }
        return base;
    });
}

module.exports = {
    api: {
        urlBase: {
            flood: function () {
              return urlBase('flood');
            },
            landSlide: function () {
              return urlBase('landslide');
            },
            avalanche: function () {
              return urlBase('avalanche');
            }
        }
    }
};
