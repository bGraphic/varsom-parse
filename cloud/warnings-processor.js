/*jslint node: true, nomen: true, vars: true, laxbreak: true, expr: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

function saveAll(objects) {
    var promise = new Parse.Promise();

    Parse.Object.saveAll(objects, function (list, error) {

        list ? promise.resolve(list) : promise.reject(error);
    });

    return promise;
}

function updateWarningWithWarning(warning, newWarning) {

    warning.set('publishTime',      newWarning.get('publishTime'));
    warning.set('nextWarningTime',  newWarning.get('nextWarningTime'));

    if (newWarning.has('regionId')) {

        warning.set('previousDangerLevel',  warning.get('dangerLevel'));

        warning.set('dangerLevel',          newWarning.get('dangerLevel'));
        warning.set('mainText',             newWarning.get('mainText'));
        warning.set('avalancheWarning',     newWarning.get('avalancheWarning'));
        warning.set('avalancheDanger',      newWarning.get('avalancheDanger'));
        warning.set('alpineWeather',        newWarning.get('alpineWeather'));
        warning.set('avalancheProblems',    newWarning.get('avalancheProblems'));

    } else {

        warning.set('previousActivityLevel',    warning.get('activityLevel'));

        warning.set('municipalityId',           newWarning.get('municipalityId'));
        warning.set('activityLevel',            newWarning.get('activityLevel'));
        warning.set('mainText',                 newWarning.get('mainText'));
        warning.set('warningText',              newWarning.get('warningText'));
        warning.set('exposedHeightType',        newWarning.get('exposedHeightType'));
        warning.set('exposedHeightValue',       newWarning.get('exposedHeightValue'));
        warning.set('causeList',                newWarning.get('causeList'));

        if (newWarning.has('typeList')) {
            warning.set('typeList', newWarning.get('typeList'));
        }
    }

    return warning;
}

function isSameArea(warning, newWarning) {
    var isSame = false;

    if (warning.has('municipalityId') && newWarning.has('municipalityId')) {
        isSame = warning.get('municipalityId') === newWarning.get('municipalityId');
    } else if (warning.has('countyId') && newWarning.has('countyId')) {
        isSame = warning.get('countyId') === newWarning.get('countyId');
    } else if (warning.has('regionId') && newWarning.has('regionId')) {
        isSame = warning.get('regionId') === newWarning.get('regionId');
    }

    return isSame;
}

function isSameWarning(warning, newWarning) {
    return isSameArea(warning, newWarning)
        && warning.get('validFrom').getTime() === newWarning.get('validFrom').getTime()
        && warning.get('validTo').getTime() === newWarning.get('validTo').getTime();
}

function findWarningInForecast(warning, forecast) {
    return _.find(forecast, function (forecastWarning) {
        return isSameWarning(forecastWarning, warning);
    });
}

function updateForecastWithWarnings(currentForecast, newForecast) {
    return _.map(newForecast, function (newWarning) {
        var existingWarning = findWarningInForecast(newWarning, currentForecast);
        return existingWarning ? updateWarningWithWarning(existingWarning, newWarning) : newWarning;
    });
}

function processWarningsForArea(region, newWarnings, warningType) {
    var currentWarnings = region.get(warningType + 'Forecast');
    region.set(warningType + 'Forecast', updateForecastWithWarnings(currentWarnings, newWarnings));
    return region;
}

function processWarningsForCounty(countyWarnings, warningType) {
    return Parse.Promise.as().then(function () {
        var countyQuery = new Parse.Query('County');
        countyQuery.equalTo('countyId', countyWarnings.countyId);
        countyQuery.include(warningType + 'Forecast');
        return countyQuery.first();
    }).then(function (county) {
        if(county) {
          var updatedCounty = processWarningsForArea(county, countyWarnings.warnings, warningType);
          return updatedCounty.save();
        } else {
          console.error('No county in Parse with id: ' + countyWarnings.countyId);
          return Parse.Promise.as();
        }
    });
}

function processWarningsForMunicipality(municipalityWarnings, warningType) {
    return Parse.Promise.as().then(function () {
        var municipalityQuery = new Parse.Query('Municipality');
        municipalityQuery.equalTo('countyId', municipalityWarnings.countyId);
        municipalityQuery.include(warningType + 'Forecast');
        return municipalityQuery.find();
    }).then(function (municipalities) {
        var municpalitySaveList = [];

        _.each(municipalities, function (municipality) {
            var updatedMunicipality = processWarningsForArea(municipality, municipalityWarnings.warnings[municipality.get("municipalityId")], warningType);
            municpalitySaveList.push(updatedMunicipality);
        });

        return saveAll(municpalitySaveList);
    });
}

function processAvalancheWarningsForRegion(regionWarnings, warningType) {
    return Parse.Promise.as().then(function () {
        var regionQuery = new Parse.Query('AvalancheRegion');
        regionQuery.equalTo('regionId', regionWarnings.regionId);
        regionQuery.include(warningType + 'Forecast');
        return regionQuery.first();
    }).then(function (region) {
        if(region) {
          var updatedRegion = processWarningsForArea(region, regionWarnings.warnings, warningType);
          return updatedRegion.save();
        } else {
          console.error('No avalanche region in Parse with id: ' + regionWarnings.regionId);
          return Parse.Promise.as();
        }
    });
}

module.exports = {
    processFloodWarningsForCounty: function (countyWarnings) {
        return processWarningsForCounty(countyWarnings, "FloodWarning");
    },
    processFloodWarningsForMunicipality: function (municipalityWarnings) {
        return processWarningsForMunicipality(municipalityWarnings, "FloodWarning");
    },
    processLandSlideWarningsForCounty: function (countyWarnings) {
        return processWarningsForCounty(countyWarnings, "LandSlideWarning");
    },
    processLandSlideWarningsForMunicipality: function (municipalityWarnings) {
        return processWarningsForMunicipality(municipalityWarnings, "LandSlideWarning");
    },
    processAvalancheWarningsForRegion: function (regionWarnings) {
        return processAvalancheWarningsForRegion(regionWarnings, "AvalancheWarning");
    }
};
