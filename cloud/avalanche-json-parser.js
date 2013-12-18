/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

function updateWarningWithJSON(avalancheWarning, avalancheWarningJSON) {

    avalancheWarning.set('validFrom', new Date(avalancheWarningJSON.ValidFrom + "+01:00"));
    avalancheWarning.set('validTo', new Date(avalancheWarningJSON.ValidTo + "+01:00"));

    avalancheWarning.set('dangerLevel', avalancheWarningJSON.DangerLevel);
    avalancheWarning.set('mainText', avalancheWarningJSON.MainText);

    return avalancheWarning;
}

function updateWarningWithWarning(avalancheWarning, newAvalancheWarning) {

    avalancheWarning.set('dangerLevel', newAvalancheWarning.get('dangerLevel'));
    avalancheWarning.set('mainText', newAvalancheWarning.get('mainText'));
    return avalancheWarning;
}

function isSameWarning(avalancheWarning, otherAvalancheWarning) {

    return avalancheWarning.get('regionId') === otherAvalancheWarning.get('regionId')
            && avalancheWarning.get('validFrom').getTime() === otherAvalancheWarning.get('validFrom').getTime()
            && avalancheWarning.get('validTo').getTime() === otherAvalancheWarning.get('validTo').getTime();
}

function findWarningInForecast(warning, forecast) {
    return _.find(forecast, function (forecastWarning) {
        return isSameWarning(forecastWarning, warning);
    });
}

function updateForcastWithWarnings(forecast, warnings) {
    var updatedForecast = [];

    _.each(warnings, function (warning) {
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

function AvlancheJSONParser() {

    this.warningType = "AvalancheWarning";

    this.regionWarningListJSONToWarnings = function (regionWarningListJSON) {
        var warnings = [];
        var self = this;

        _.each(regionWarningListJSON, function (avalancheWarningJSON) {
            var avalancheWarning = new Parse.Object(self.warningType);
            warnings.push(updateWarningWithJSON(avalancheWarning, avalancheWarningJSON));
        });

        return warnings;
    };

    this.warningsJSONToWarnings = function (regionSummariesJSON) {

        var self = this;

        var regionQuery = new Parse.Query("AvalancheRegion");
        regionQuery.include(self.warningType + 'Forecast');

        return regionQuery.find().then(function (regions) {

            var promises = [];

            _.each(regionSummariesJSON, function (regionSummaryJSON) {

                var regionWarnings = self.regionWarningListJSONToWarnings(regionSummaryJSON.AvalancheWarningList);
                var regionId = regionSummaryJSON.Id;

                _.each(regionWarnings, function (regionWarning) {
                    regionWarning.set('regionId', regionId);
                });

                if (regionSummaryJSON.AvalancheWarningList.length !== 3) {
                    console.error("Region " + regionId + " has " + regionWarnings.length + "warnings");
                }

                var region = _.find(regions, function (region) {
                    return region.get('regionId') === regionId;
                });

                var forecast = updateForcastWithWarnings(region.get(self.warningType + 'Forecast'), regionWarnings);
                region.set(self.warningType + 'Forecast', forecast);

                promises.push(region.save());

            });

            return Parse.Promise.when(promises);
        });
    };
}

module.exports = {
    avalancheWarningsJSONParser: new AvlancheJSONParser()
};
