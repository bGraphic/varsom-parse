/*jslint node: true, nomen: true, vars: true */
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

function deserializeWarnings(countyOverViewJSON, processors, saver, warningType) {
    var promises = [];
    
    _.each(countyOverViewJSON, function (countyJSON) {
        var countyId = countyJSON.Id,
            countyWarnings = [];
    
        _.each(countyJSON.MunicipalityList, function (municipalityJSON) {
            var municipalityId = municipalityJSON.Id,
                municipalityWarnings = [];
            
            _.each(municipalityJSON.WarningList, function (warningJSON, index) {
                var warning = deserializeWarning(warningJSON, warningType);
                warning.set('countyId', countyId);
                warning.set('municipalityId', municipalityId);
                warning.set('forecastDay', index);
                municipalityWarnings.push(warning);
            });
            
            if (municipalityWarnings.length !== 3) {
                console.error("Municipality " + municipalityJSON.Id + " has " 
                              + municipalityJSON.WarningList.length + "warnings");
            }
                    
            promises.push(processors.municipalityProcessor({
                municipalityId: municipalityId,
                warnings: municipalityWarnings
            }).then(saver));

            countyWarnings = updateCountyForecastWithMunicipalityForecast(countyWarnings, municipalityWarnings);
        });
        
        promises.push(processors.countyProcessor({
            countyId: countyId,
            warnings: countyWarnings
        }).then(saver));
    });
    
    return Parse.Promise.when(promises);
}

function deserializeAvalancheWarnings(json, processor, saver) {
    var promises = [];
    
    _.each(json, function (regionJSON) {
        var regionId = regionJSON.Id,
            regionWarnings = [];
        
            _.each(regionJSON.AvalancheWarningList, function (warningJSON, index) {
                var warning = deserializeAvalancheWarning(warningJSON);
                warning.set('regionId', regionId);
                warning.set('forecastDay', index);
                regionWarnings.push(warning);
            });
        
        if (regionWarnings.length !== 3) {
            console.error("Region " + regionId + " has " 
                          + regionWarnings.length + "warnings");
        }
        
        promises.push(processor({
            regionId: regionId,
            warnings: regionWarnings
        }).then(saver));
    });
    
    return Parse.Promise.when(promises);
}

module.exports = {
    deserializeFloodWarnings: function (json, processors, saver) {
        return deserializeWarnings(json, processors, saver, "FloodWarning");    
    },
    deserializeLandSlideWarnings: function (json, processors, saver) {
        return deserializeWarnings(json, processors, saver, "LandSlideWarning");
    },
    deserializeAvalancheWarnings: deserializeAvalancheWarnings
};