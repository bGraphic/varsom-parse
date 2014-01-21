/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

function parseIdListJSONToArray(listJSON) {
    return _.map(listJSON, function (entryJSON) {
        return entryJSON.ID;
    });
}

function deserializeWarning(warningJSON, warningType) {
    var warning = new Parse.Object(warningType);
    
    warning.set('validFrom', new Date(warningJSON.ValidFrom + "+01:00"));
    warning.set('validTo', new Date(warningJSON.ValidTo + "+01:00"));
    warning.set('previousActivityLevel', '-1');
    warning.set('activityLevel', warningJSON.ActivityLevel);
    warning.set('mainText', warningJSON.MainText);
    warning.set('warningText', warningJSON.WarningText);
    warning.set('exposedHeightType', warningJSON.ExposedHeightType);
    warning.set('exposedHeightValue', warningJSON.ExposedHeightValue);
    warning.set('causeList', parseIdListJSONToArray(warningJSON.CauseList));
    if (warningType === "LandSlideWarning") {
        warning.set('landSlideTypeListJSON', parseIdListJSONToArray(warningJSON.LandSlideTypeList));
    }
    
    return warning;
}

function parseAvalancheProblems(avalancheProblemsJSON) {
    return _.map(avalancheProblemsJSON, function (problemJSON) {
        return {
            extId: problemJSON.AvalancheExtId,
            probabilityId: problemJSON.AvalProbabilityId,
            triggerId: problemJSON.AvalTriggerSimpleId
        };
    });
}

function deserializeAvalancheWarning(avalancheWarningJSON) {
    var avalancheWarning = new Parse.Object("AvalancheWarning");
    
    avalancheWarning.set('validFrom', new Date(avalancheWarningJSON.ValidFrom + "+01:00"));
    avalancheWarning.set('validTo', new Date(avalancheWarningJSON.ValidTo + "+01:00"));
    avalancheWarning.set('previousDangerLevel', '-1');
    avalancheWarning.set('dangerLevel', avalancheWarningJSON.DangerLevel);
    avalancheWarning.set('mainText', avalancheWarningJSON.MainText);
    avalancheWarning.set('avalancheWarning', avalancheWarningJSON.AvalancheWarning);
    avalancheWarning.set('avalancheProblems', parseAvalancheProblems(avalancheWarningJSON.AvalancheProblems));

    return avalancheWarning;   
}

function updateCountyForecastWithMunicipalityForecast(countyForecast, municipalityForecast) {
    _.each(municipalityForecast, function (warning, i) {
        if (i > countyForecast.length - 1) {
            countyForecast.push(warning.clone());
        } else if (warning.get("activityLevel") > countyForecast[i].get("activityLevel")) {
            countyForecast[i] = warning.clone();
        }
    });
    return countyForecast;
}

function deserializeWarnings(countyOverViewJSON, processors, warningType) {
    var promise = Parse.Promise.as();
    
    _.each(countyOverViewJSON, function (countyJSON) {
        var countyId = countyJSON.Id,
            countyWarnings = [];
    
        _.each(countyJSON.MunicipalityList, function (municipalityJSON) {
            var municipalityId = municipalityJSON.Id,
                municipalityWarnings = _.map(municipalityJSON.WarningList, function (warningJSON) {
                    var warning = deserializeWarning(warningJSON, warningType);
                    warning.set('countyId', countyId);
                    warning.set('municipalityId', municipalityId);
                    return warning;
                });
            
            if (municipalityWarnings.length !== 3) {
                console.error("Municipality " + municipalityJSON.Id + " has " 
                              + municipalityJSON.WarningList.length + "warnings");
            }
                    
            promise = promise.then(function () {
                return processors.municipalityProcessor({
                    municipalityId: municipalityId,
                    warnings: municipalityWarnings
                });
            });

            countyWarnings = updateCountyForecastWithMunicipalityForecast(countyWarnings, municipalityWarnings);
        });
        
        promise = promise.then(function () {
            return processors.countyProcessor({
                countyId: countyId,
                warnings: countyWarnings
            });
        });
    });
    
    return promise; 
}

function deserializeAvalancheWarnings(json, processor) {
    var promise = Parse.Promise.as();
    
    _.each(json, function (regionJSON) {
        var regionId = regionJSON.Id,
            regionWarnings = _.map(regionJSON.AvalancheWarningList, function (warningJSON) {
                var warning = deserializeAvalancheWarning(warningJSON);
                warning.set('regionId', regionId);
                return warning;
            });
        
        if (regionWarnings.length !== 3) {
            console.error("Region " + regionId + " has " 
                          + regionWarnings.length + "warnings");
        }
        
        promise = promise.then(function () {
            return processor({
                regionId: regionId,
                warnings: regionWarnings
            });
        });
    });
    
    return promise;
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