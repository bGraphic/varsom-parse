/*jslint node: true, nomen: true, vars: true, laxbreak: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var oslo = require('cloud/moment-timezone-data-oslo.js');
var moment = require('cloud/moment-timezone.js');
moment.tz.add(oslo);

function parseIdListJSONToArray(listJSON) {
    return _.map(listJSON, function (entryJSON) {
        return entryJSON.Id;
    });
}

function deserializeAvalancheProblems(avalancheProblemsJSON) {
    return _.map(avalancheProblemsJSON, function (problemJSON) {
        return {
            problemId: problemJSON.AvalancheProblemId,          // Sort order for avalanche problems
            extId: problemJSON.AvalancheExtId,
            causeId: problemJSON.AvalCauseId,
            triggerSimpleId: problemJSON.AvalTriggerSimpleId,
            destructiveSizeExtId: problemJSON.DestructiveSizeExtId,
            probabilityId: problemJSON.AvalProbabilityId,
            exposedHeightFill: problemJSON.ExposedHeightFill,
            exposedHeight1: problemJSON.ExposedHeight1,
            exposedHeight2: problemJSON.ExposedHeight2,
            validExpositions: problemJSON.ValidExpositions
        };
    }).sort(function (a, b) {
      return a.problemId < b.problemId
    });
}

function deserializeWarning(warningJSON, warningType) {
    var warning = new Parse.Object(warningType);
    var timezone = "Europe/Oslo";

    warning.set('validFrom', moment.tz(warningJSON.ValidFrom, timezone).toDate());
    warning.set('validTo', moment.tz(warningJSON.ValidTo, timezone).toDate());

    warning.set('publishTime', moment.tz(warningJSON.PublishTime, timezone).toDate());
    warning.set('nextWarningTime', moment.tz(warningJSON.NextWarningTime, timezone).toDate());

    if(warningJSON.MainText)
      warning.set('mainText', {no: warningJSON.MainText.trim()});

    if (warningType === "LandSlideWarning" || warningType === "FloodWarning") {

      warning.set('activityLevel', parseInt(warningJSON.ActivityLevel));

      if(warningJSON.WarningText)
        warning.set('warningText', {no: warningJSON.WarningText.trim()});

      warning.set('exposedHeightType', warningJSON.ExposedHeightType);
      warning.set('exposedHeightValue', warningJSON.ExposedHeightValue);

      warning.set('causeList', parseIdListJSONToArray(warningJSON.CauseList));
    }

    if (warningType === "LandSlideWarning") {

      warning.set('typeList', parseIdListJSONToArray(warningJSON.LandSlideTypeList));
    }

    if(warningType === "AvalancheWarning") {

      warning.set('dangerLevel', parseInt(warningJSON.DangerLevel));

      if(warningJSON.AvalancheWarning)
        warning.set('avalancheWarning', {no: warningJSON.AvalancheWarning.trim()});
      if(warningJSON.AvalancheDanger)
        warning.set('avalancheDanger', {no: warningJSON.AvalancheDanger.trim()});
      if(warningJSON.AlpineWeather)
        warning.set('alpineWeather', {no: warningJSON.AlpineWeather.trim()});

      var avalancheProblems = deserializeAvalancheProblems(warningJSON.AvalancheProblems)
      warning.set('avalancheProblems', avalancheProblems);
    }

    return warning;
}

function updateCountyForecastWithMunicipalityForecast(countyForecast, municipalityForecast) {
    _.each(municipalityForecast, function (warning, i) {
        if (i > countyForecast.length - 1) {
            countyForecast.push(warning);
        } else if (warning.get("activityLevel") > countyForecast[i].get("activityLevel")) {
            countyForecast[i] = warning;
        }
    });
    return countyForecast;
}

function deserializeWarnings(countyOverViewJSON, processors, warningType) {
    var promises = [];

    _.each(countyOverViewJSON.CountyList, function (countyJSON) {
        var countyId = countyJSON.Id,
            countyForecast = [],
            municipalityForecasts = {};

        _.each(countyJSON.MunicipalityList, function (municipalityJSON) {
            var municipalityId = municipalityJSON.Id,
                municipalityForecast = _.map(municipalityJSON.WarningList, function (warningJSON) {
                    var warning = deserializeWarning(warningJSON, warningType);
                    warning.set('countyId', countyId);
                    warning.set('municipalityId', municipalityId);
                    return warning;
                });

            if (municipalityForecast.length !== 3) {
                console.error("Municipality " + municipalityJSON.Id + " has "
                              + municipalityJSON.WarningList.length + "warnings");
            }

            municipalityForecasts[municipalityId] = municipalityForecast;
            countyForecast = updateCountyForecastWithMunicipalityForecast(countyForecast, municipalityForecast);
        });

        promises.push(processors.municipalityProcessor({
            countyId: countyId,
            warnings: municipalityForecasts
        }));

        promises.push(processors.countyProcessor({
            countyId: countyId,
            warnings: countyForecast
        }));
    });

    return Parse.Promise.when(promises);
}

function deserializeAvalancheWarnings(json, processor) {
    var promises = [];

    _.each(json, function (regionJSON) {
        var regionId = regionJSON.Id,
            regionForecast = _.map(regionJSON.AvalancheWarningList, function (warningJSON) {
                var warning = deserializeWarning(warningJSON, "AvalancheWarning");
                warning.set('regionId', regionId);
                return warning;
            });

        if (regionForecast.length !== 3) {
            console.error("Region " + regionId + " has "
                          + regionForecast.length + "warnings");
        }

        promises.push(processor({
            regionId: regionId,
            warnings: regionForecast
        }));
    });

    return Parse.Promise.when(promises);
}

module.exports = {
    deserializeFloodWarnings: function (json, processors) {
        return deserializeWarnings(json, processors, "FloodWarning");
    },
    deserializeLandSlideWarnings: function (json, processors) {
        return deserializeWarnings(json, processors, "LandSlideWarning");
    },
    deserializeAvalancheWarnings: deserializeAvalancheWarnings
};
