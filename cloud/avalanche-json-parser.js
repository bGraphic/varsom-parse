/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');

function updateRegionWithJSON(avalancheRegion, avalancheRegionJSON) {
    avalancheRegion.set('regionId', avalancheRegionJSON.Id);
    avalancheRegion.set('name', avalancheRegionJSON.Name);

    return avalancheRegion;
}

function updateRegionWithRegion(avalancheRegion, newAvalancheRegion) {
    avalancheRegion.set('name', newAvalancheRegion.get('name'));
    return avalancheRegion;
}

function isSameRegion(region, otherRegion) {
    return region.get('regionId') === otherRegion.get('regionId');
}

function updateWarningWithJSON(avalancheWarning, avalancheWarningJSON) {

    avalancheWarning.set('regionId', avalancheWarningJSON.RegionId);
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

function AvlancheJSONParser() {

    this.regionSummariesJSONToRegions = function (avalancheRegionSummariesJSON) {
        var regions = [];
        _.each(avalancheRegionSummariesJSON, function (avalancheRegionSummaryJSON) {
            var avalancheRegion = new Parse.Object('AvalancheRegion');
            regions.push(updateRegionWithJSON(avalancheRegion, avalancheRegionSummaryJSON));
        });
        return regions;
    };

    this.createOrUpdateAvalancheRegions = function (newAvalancheRegions) {
        var regionQuery = new Parse.Query('AvalancheRegion');

        return regionQuery.find().then(function (avalancheRegions) {

            var promises = [];

            _.each(newAvalancheRegions, function (newAvalancheRegion) {
                var avalancheRegion = _.find(avalancheRegions, function (avalancheRegion) {
                    return isSameRegion(avalancheRegion, newAvalancheRegion);
                });

                if (!avalancheRegion) {
                    avalancheRegion = newAvalancheRegion;
                } else {
                    avalancheRegion = updateRegionWithRegion(avalancheRegion, newAvalancheRegion);
                }

                promises.push(avalancheRegion.save());

            });

            return Parse.Promise.when(promises);
        });
    };

    this.regionSummariesJSONToWarnings = function (avalancheRegionSummariesJSON) {
        var warnings = [];
        _.each(avalancheRegionSummariesJSON, function (avalancheRegionSummaryJSON) {
            _.each(avalancheRegionSummaryJSON.AvalancheWarningList, function (avalancheWarningJSON) {
                var avalancheWarning = new Parse.Object('AvalancheWarning');
                warnings.push(updateWarningWithJSON(avalancheWarning, avalancheWarningJSON));
            });
        });
        return warnings;
    };

    this.createOrUpdateAvalancheWarnings = function (newAvalancheWarnings) {
        var warningQuery = new Parse.Query('AvalancheWarning');
        warningQuery.greaterThan("validTo", new Date());
        warningQuery.limit(1000);

        return warningQuery.find().then(function (avalancheWarnings) {

            var promises = [];

            _.each(newAvalancheWarnings, function (newAvalancheWarning) {
                var avalancheWarning = _.find(avalancheWarnings, function (avalancheWarning) {
                    return isSameWarning(avalancheWarning, newAvalancheWarning);
                });

                if (!avalancheWarning) {
                    avalancheWarning = newAvalancheWarning;
                } else {
                    avalancheWarning = updateWarningWithWarning(avalancheWarning, newAvalancheWarning);
                }

                promises.push(avalancheWarning.save());

            });

            return Parse.Promise.when(promises);

        });
    };
}

module.exports = new AvlancheJSONParser();
