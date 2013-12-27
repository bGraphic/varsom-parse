/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var pushNotifier = require('cloud/push-notifier.js');

function updateWarningWithJSON(warning, warningJSON) {

    warning.set('validFrom', new Date(warningJSON.ValidFrom + "+01:00"));
    warning.set('validTo', new Date(warningJSON.ValidTo + "+01:00"));

    warning.set('activityLevel', warningJSON.ActivityLevel);
    warning.set('mainText', warningJSON.MainText);
    warning.set('warningText', warningJSON.WarningText);

    return warning;
}

function updateWarningWithWarning(warning, newWarning) {

    warning.set('activityLevel', newWarning.get('activityLevel'));
    warning.set('mainText', newWarning.get('mainText'));
    warning.set('warningText', newWarning.get('warningText'));

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

function updateForcastWithWarnings(forecast, newForecast) {
    var updatedForecast = [];

    _.each(newForecast, function (warning) {
        var forecastWarning = findWarningInForecast(warning, forecast);

        if (!forecastWarning) {
            forecastWarning = warning;
        } else {
            forecastWarning = updateWarningWithWarning(forecastWarning, warning);
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
            warnings.push(updateWarningWithJSON(warning, warningJSON));
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

                        var cachedMunicipalityForecast = JSON.parse(JSON.stringify(municipality.get(self.warningType + 'Forecast')));

                        var municipalityForecast = municipality.get(self.warningType + 'Forecast');
                        var newMunicipalityForecast = updateForcastWithWarnings(municipalityForecast, municipalityWarnings);

                        municipality.set(self.warningType + 'Forecast', newMunicipalityForecast);

                        newCountyForecast = updateCountyForecastWithMunicipalityForecast(newCountyForecast, newMunicipalityForecast);

                        saveList.push(municipality);
                        promises.push(pushNotifier.pushUpdates(municipality, self.warningType,
                                                               cachedMunicipalityForecast, newMunicipalityForecast));

                    });

                    var cachedCountyForecast = JSON.parse(JSON.stringify(county.get(self.warningType + 'Forecast')));
                    county.set(self.warningType + 'Forecast', newCountyForecast);

                    promises.push(pushNotifier.pushUpdates(county, self.warningType, cachedCountyForecast, newCountyForecast));
                    promises.push(county.save());

                    Parse.Object.saveAll(saveList, function (list, error) {
                        if (list) {
                            return Parse.Promise.when(promises);
                        } else {
                            return Parse.Promise.error(error);
                        }
                    });

                });

            });

        });

        return promise;
    };
}

module.exports = {
    floodWarningsJSONParser: new WarningsJSONParser('FloodWarning'),
    landSlideWarningsJSONParser: new WarningsJSONParser('LandSlideWarning')
};
