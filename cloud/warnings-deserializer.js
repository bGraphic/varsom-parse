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

function deserializeWarning(warningJSON, warningType) {
    var warning = new Parse.Object(warningType);
    var timezone = "Europe/Oslo";

    warning.set('validFrom', moment.tz(warningJSON.ValidFrom, timezone).toDate());
    warning.set('validTo', moment.tz(warningJSON.ValidTo, timezone).toDate());

    warning.set('publishTime', moment.tz(warningJSON.PublishTime, timezone).toDate());
    warning.set('nextWarningTime', moment.tz(warningJSON.NextWarningTime, timezone).toDate());

    if(warningJSON.MainText)
      warning.set('mainText', warningJSON.MainText.trim());

    if (warningType === "LandSlideWarning" || warningType === "FloodWarning") {

      warning.set('previousActivityLevel', '-1');
      warning.set('activityLevel', warningJSON.ActivityLevel);

      if(warningJSON.WarningText)
        warning.set('warningText', warningJSON.WarningText.trim());

      warning.set('exposedHeightType', warningJSON.ExposedHeightType);
      warning.set('exposedHeightValue', warningJSON.ExposedHeightValue);

      warning.set('causeList', parseIdListJSONToArray(warningJSON.CauseList));
    }

    if (warningType === "LandSlideWarning") {

      warning.set('typeList', parseIdListJSONToArray(warningJSON.LandSlideTypeList));
    }

    if(warningType === "AvalancheWarning") {

      warning.set('previousDangerLevel', '-1');
      warning.set('dangerLevel', warningJSON.DangerLevel);

      if(warningJSON.AvalancheWarning)
        warning.set('avalancheWarning', warningJSON.AvalancheWarning.trim());
      if(warningJSON.AvalancheDanger)
        warning.set('avalancheDanger', warningJSON.AvalancheDanger.trim());
      if(warningJSON.AlpineWeather)
        warning.set('alpineWeather', warningJSON.AlpineWeather.trim());

      warning.set('avalancheProblems', deserializeAvalancheProblems(warningJSON.AvalancheProblems));
    }

    return warning;
}

function deserializeAvalancheProblems(avalancheProblemsJSON) {
    return _.map(avalancheProblemsJSON, function (problemJSON) {
        return {
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
    });
}

function updateCountyForecastWithMunicipalityForecast(countyForecast, municipalityForecast) {
    _.each(municipalityForecast, function (warning, i) {
        var countyWarning = warning.clone();
        countyWarning.set("municipalityId", null);
        if (i > countyForecast.length - 1) {
            countyForecast.push(countyWarning);
        } else if (warning.get("activityLevel") > countyForecast[i].get("activityLevel")) {
            countyForecast[i] = countyWarning;
        }
    });
    return countyForecast;
}

function deserializeWarnings(countyOverViewJSON, processors, warningType) {
    var promises = [];

    _.each(countyOverViewJSON, function (countyJSON) {
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
