/*jslint node: true, nomen: true */
/*global Parse */

'use strict';

var _ = require('underscore'),
    SIGNIFICANT_CHANGE_OLD_LEVEL = 0,
    SIGNIFICANT_CHANGE_THRESHOLD = 1;


function isSameWarning(newWarning, oldWarning) {
    return newWarning.get('validFrom').getTime() === oldWarning.get('validFrom').getTime() && newWarning.get('validTo').getTime() === oldWarning.get('validTo').getTime();
}

function findWarningLevel(warning) {
    return (warning.has('dangerLevel')) ? warning.get('dangerLevel')
        : (warning.has('activityLevel')) ? warning.get('activityLevel')
            : -1;
}

function warningLevelHasChanged(newWarning, oldWarning) {
    var oldLevel = findWarningLevel(oldWarning),
        newLevel = findWarningLevel(newWarning);

    return oldLevel !== -1
        && newLevel !== -1
        && oldLevel !== newLevel;
}

function warningLevelHasChangedSignificantly(newWarning, oldWarning) {
    var oldLevel = findWarningLevel(oldWarning),
        newLevel = findWarningLevel(newWarning);

    return oldLevel === SIGNIFICANT_CHANGE_OLD_LEVEL
        && newLevel > SIGNIFICANT_CHANGE_THRESHOLD;
}

function areaIDForArea(area) {
    return area.has('regionId') ? area.get('regionId')
        : area.has('countyId') ? area.get('countyId')
            : area.has('municipalityId') ? area.get('municipalityId')
                : -1;
}

function pushUpdates(area, warningType, oldForecast, newForecast) {
    var promise = Parse.Promise.as(),
        areaID = areaIDForArea(area);

    promise = promise.then(function () {

        var combinedForecasts = _.map(newForecast, function (newWarning) {
            var oldWarning;
            oldWarning = _.find(oldForecast, function (warning) {
                if (isSameWarning(newWarning, warning)) {
                    return warning;
                }
            });

            return { oldWarning: oldWarning, newWarning: newWarning };

        });

        var changedWarning = _.find(combinedForecasts, function (combinedForecast, index) {
            var oldWarning = combinedForecast.oldWarning,
                newWarning = combinedForecast.newWarning;

            if (oldWarning !== undefined && warningLevelHasChanged(newWarning, oldWarning)) {
                if (index < 2 || (index === 2 && warningLevelHasChangedSignificantly(newWarning, oldWarning))) {
                    return newWarning;
                }
            }
        });

        if (changedWarning !== undefined && areaID !== -1) {
            var locArgs = [],
                locArgsOldTemp = [],
                locArgsNewTemp = [];

            _.each(combinedForecasts, function (combinedForecast, index) {
                var oldWarning = combinedForecast.oldWarning,
                    newWarning = combinedForecast.newWarning;
                locArgsOldTemp.push(findWarningLevel(oldWarning));
                locArgsNewTemp.push(findWarningLevel(newWarning));
            });

            locArgs.push(area.get("name"));
            locArgs = locArgs.concat(locArgsOldTemp).concat(locArgsNewTemp);

            var pushQuery = new Parse.Query(Parse.Installation);
            pushQuery.equalTo('deviceType', 'ios');
            pushQuery.equalTo('channels', area.className + '-' + areaID);
            return Parse.Push.send({
                where: pushQuery,
                data: {
                    alert : {
                        "loc-key": warningType + " forecast changed",
                        "loc-args": locArgs
                    },
                    warningType: warningType,
                    areaType: area.className,
                    areaId: areaID
                }
            });
        }

        return Parse.Promise.as();

    });

    return promise;
}

module.exports = {
    pushUpdates: pushUpdates
};
