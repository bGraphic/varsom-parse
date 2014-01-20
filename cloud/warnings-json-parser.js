/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var pushNotifier = require('cloud/push-notifier.js');

function parseIdListJSONToArray(listJSON) {
    var array = [];

    _.each(listJSON, function (entryJSON) {
        array.push(entryJSON.Id);
    });

    return array;
}

function saveAll(objects) {
    var promise = new Parse.Promise();

    Parse.Object.saveAll(objects, function (list, error) {
        if (list) {
            promise.resolve(list);
        } else {
            promise.reject(error);
        }
    });

    return promise;
}

function updateWarningWithJSON(warning, warningJSON, warningType) {

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

function updateWarningWithWarning(warning, newWarning, warningType) {

    warning.set('previousActivityLevel', warning.get('activityLevel'));
    warning.set('activityLevel', newWarning.get('activityLevel'));

    warning.set('mainText', newWarning.get('mainText'));
    warning.set('warningText', newWarning.get('warningText'));

    warning.set('exposedHeightType', newWarning.get('exposedHeightType'));
    warning.set('exposedHeightValue', newWarning.get('exposedHeightValue'));

    warning.set('causeListJSON', newWarning.get('causeListJSON'));

    if (warningType === "LandSlideWarning") {
        warning.set('landSlideTypeListJSON', newWarning.get('landSlideTypeListJSON'));
    }

    return warning;
}

function isSameWarning(warning, newWarning) {
    return warning.get('municipalityId') === newWarning.get('municipalityId')
            && warning.get('validFrom').getTime() === newWarning.get('validFrom').getTime()
            && warning.get('validTo').getTime() === newWarning.get('validTo').getTime();
}

function findWarningInForecast(warning, forecast) {
    return _.find(forecast, function (forecastWarning) {
        return isSameWarning(forecastWarning, warning);
    });
}

function updateForcastWithWarnings(forecast, newForecast, warningType) {

    var updatedForecast = [];

    _.each(newForecast, function (warning) {
        var forecastWarning = findWarningInForecast(warning, forecast);

        if (!forecastWarning) {
            forecastWarning = warning;
        } else {
            forecastWarning = updateWarningWithWarning(forecastWarning, warning, warningType);
        }

        updatedForecast.push(forecastWarning);
    });

    return updatedForecast;
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

function WarningsJSONParser(warningType) {

    this.warningType = warningType;

    this.municipalityWarningListJSONToWarnings = function (municipalityWarningListJSON) {
        var warnings = [];
        var self = this;

        _.each(municipalityWarningListJSON, function (warningJSON) {
            var warning = new Parse.Object(self.warningType);
            warnings.push(updateWarningWithJSON(warning, warningJSON, self.warningType));
        });

        return warnings;
    };

    this.warningsJSONToWarnings = function (countyOverviewJSON) {

        var self = this;
        var promise = Parse.Promise.as();

        _.each(countyOverviewJSON, function (countyJSON) {
            var countyId = countyJSON.Id;

            promise = promise.then(function () {

                var countyQuery = new Parse.Query("County");
                countyQuery.equalTo("countyId", countyId);
                countyQuery.include(self.warningType + 'Forecast');
                return countyQuery.first();

            }).then(function (county) {

                var municipalityQuery = new Parse.Query("Municipality");
                municipalityQuery.equalTo("countyId", countyId);
                municipalityQuery.include(self.warningType + 'Forecast');
                municipalityQuery.limit(1000);

                return municipalityQuery.find().then(function (municipalities) {

                    var saveList = [];
                    var promises = [];

                    var newCountyForecast = [];

                    _.each(countyJSON.MunicipalityList, function (municipalityJSON) {

                        if (municipalityJSON.WarningList.length !== 3) {
                            console.error("Municipality " + municipalityJSON.Id + " has " + municipalityJSON.WarningList.length + "warnings");
                        }

                        var municipalityWarnings = self.municipalityWarningListJSONToWarnings(municipalityJSON.WarningList);
                        var municipalityId = municipalityJSON.Id;

                        _.each(municipalityWarnings, function (municipalityWarning) {
                            municipalityWarning.set('countyId', countyId);
                            municipalityWarning.set('municipalityId', municipalityId);
                        });

                        var municipality = _.find(municipalities, function (municipality) {
                            return municipality.get('municipalityId') === municipalityId;
                        });

                        var cachedMunicipalityForecast = _.map(municipality.get(self.warningType + 'Forecast'), function (warning) {
                            return warning.clone();
                        });

                        var municipalityForecast = municipality.get(self.warningType + 'Forecast');
                        var newMunicipalityForecast = updateForcastWithWarnings(municipalityForecast, municipalityWarnings, self.warningType);

                        municipality.set(self.warningType + 'Forecast', newMunicipalityForecast);

                        newCountyForecast = updateCountyForecastWithMunicipalityForecast(newCountyForecast, newMunicipalityForecast);

                        saveList.push(municipality);
                    });

                    var cachedCountyForecast = _.map(county.get(self.warningType + 'Forecast'), function (warning) {
                        return warning.clone();
                    });

                    county.set(self.warningType + 'Forecast', newCountyForecast);

                    saveList.push(county.save());

                    return saveAll(saveList).then(function (list) {
                        return Parse.Promise.when(promises);
                    });


                });

            });

        });

        promise = promise.then(function () {
            console.log(self.warningType + ": json imported");
            return Parse.Promise.as();
        }, function (error) {
            console.log(self.warningType + ": problem - " + JSON.stringify(error));
            if (error.code === 100) {
                console.log(self.warningType + ": try again");
                return self.warningsJSONToWarnings(countyOverviewJSON);
            } else {
                console.error(self.warningType + ": json import failed");
                return Parse.Promise.as();
            }
        });

        return promise;
    };
}

module.exports = {
    floodWarningsJSONParser: new WarningsJSONParser('FloodWarning'),
    landSlideWarningsJSONParser: new WarningsJSONParser('LandSlideWarning')
};
