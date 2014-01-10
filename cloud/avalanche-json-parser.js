/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var pushNotifier = require('cloud/push-notifier.js');

function parseAvalancheProblems(avalancheProblemsJSON) {
    var problems = [];

    _.each(avalancheProblemsJSON, function (problemJSON) {

        problems.push({
            extId: problemJSON.AvalancheExtId,
            probabilityId: problemJSON.AvalProbabilityId,
            triggerId: problemJSON.AvalTriggerSimpleId
        });

    });

    return problems;
}

function updateWarningWithJSON(avalancheWarning, avalancheWarningJSON) {

    avalancheWarning.set('validFrom', new Date(avalancheWarningJSON.ValidFrom + "+01:00"));
    avalancheWarning.set('validTo', new Date(avalancheWarningJSON.ValidTo + "+01:00"));

    avalancheWarning.set('dangerLevel', avalancheWarningJSON.DangerLevel);
    avalancheWarning.set('mainText', avalancheWarningJSON.MainText);

    avalancheWarning.set('avalancheWarning', avalancheWarningJSON.AvalancheWarning);
    avalancheWarning.set('avalancheProblems', parseAvalancheProblems(avalancheWarningJSON.AvalancheProblems));

    return avalancheWarning;
}

function updateWarningWithWarning(avalancheWarning, newAvalancheWarning) {

    avalancheWarning.set('dangerLevel', newAvalancheWarning.get('dangerLevel'));
    avalancheWarning.set('mainText', newAvalancheWarning.get('mainText'));

    avalancheWarning.set('avalancheWarning', newAvalancheWarning.get('avalancheWarning'));
    avalancheWarning.set('avalancheProblems', newAvalancheWarning.get('avalancheProblems'));

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

                var cachedForecast = _.map(region.get(self.warningType + 'Forecast'), function (warning) {
                    return warning.clone();
                });

                var newForecast = updateForcastWithWarnings(region.get(self.warningType + 'Forecast'), regionWarnings);
                region.set(self.warningType + 'Forecast', newForecast);

                promises.push(pushNotifier.pushUpdates(region, self.warningType, cachedForecast, newForecast));
                promises.push(region.save());

            });

            return Parse.Promise.when(promises).then(function () {
                console.log(self.warningType + ": json imported");
                return Parse.Promise.as();
            }, function (error) {
                console.log(self.warningType + ": problem - " + JSON.stringify(error));
                if (error.code === 100) {
                    console.log(self.warningType + ": try again");
                    return self.warningsJSONToWarnings(regionSummariesJSON);
                } else {
                    console.error(self.warningType + ": json imported failed");
                    return Parse.Promise.as();
                }
            });
        });
    };
}

module.exports = {
    avalancheWarningsJSONParser: new AvlancheJSONParser()
};
