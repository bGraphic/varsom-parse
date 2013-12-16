/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

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

function findWarningInWarnings(needleWarning, haystackWarnings) {
    var warning = _.find(haystackWarnings, function (warning) { return isSameWarning(warning, needleWarning); });
    return warning;
}

function updateForcastWithWarnings(warnings, newWarnings) {
    var forecast = [];

    _.each(newWarnings, function (newWarning) {
        var warning = findWarningInWarnings(newWarning, warnings);

        if (!warning) {
            warning = newWarning;
        } else {
            warning = updateWarningWithWarning(warning, newWarning);
        }

        forecast.push(warning);
    });

    return forecast;
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

                var municipalityQuery = new Parse.Query("Municipality");
                municipalityQuery.equalTo("countyId", countyId);
                municipalityQuery.include(self.warningType + 'Forecast');
                municipalityQuery.limit(1000);

                return municipalityQuery.find().then(function (municipalities) {

                    var promises = [];

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

                        var forecast = updateForcastWithWarnings(municipality.get(self.warningType + 'Forecast'), municipalityWarnings);
                        municipality.set(self.warningType + 'Forecast', forecast);

                        promises.push(municipality.save());

                    });

                    return Parse.Promise.when(promises);
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
