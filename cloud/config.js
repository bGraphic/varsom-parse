/*jslint node: true, nomen: true */
/*global Parse */

"use strict";

function apiVersion(type) {
    if (type === 'avalanche') {
        return 'v2.0.2';
    } else {
        return 'v1.0.3';
    }
}

function urlBase(type) {
    var base = 'http://api01.nve.no/hydrology/forecast/' + type + '/' + apiVersion(type) + '/api';

    return Parse.Config.get().then(function(config) {
        if (config.get('apiEnv') === 'test') {
            base = 'http://h-web02.nve.no/' + type + '_test/api';
        } else if (config.get('apiEnv') === 'debug') {
            base = 'http://varsom-debug-data.parseapp.com/' + type;
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
