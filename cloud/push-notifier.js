/*jslint node: true, nomen: true */
/*global Parse */

'use strict';

var _ = require('underscore'),
    SIGNIFICANT_CHANGE_OLD_LEVEL = 0,
    SIGNIFICANT_CHANGE_THRESHOLD = 1;


function isSameWarning(newWarning, oldWarning) {
    return newWarning.get('validFrom').getTime() === oldWarning.validFrom.time && newWarning.get('validTo').getTime() === oldWarning.validTo.time;
}

function findWarningLevel(warning) {
    return (warning.has('dangerLevel')) ? warning.get('dangerLevel')
        : (warning.has('activityLevel')) ? warning.get('activityLevel')
            : -1;
}

// Since the old warning object is not a parse object we need a separate method for it
function findOldWarningLevel(warning) {
    return (warning.hasOwnProperty('dangerLevel')) ? warning.dangerLevel
        : (warning.hasOwnProperty('activityLevel')) ? warning.activityLevel
            : -1;
}

function warningLevelHasChanged(newWarning, oldWarning) {
    var oldLevel = findOldWarningLevel(oldWarning),
        newLevel = findWarningLevel(newWarning);

    return oldLevel !== -1
        && newLevel !== -1
        && oldLevel !== newLevel;
}

function warningLevelHasChangedSignificantly(newWarning, oldWarning) {
    var oldLevel = findOldWarningLevel(oldWarning),
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
            var oldWarning = _.find(function (warning) {
                if (isSameWarning(newWarning, warning)) {
                    return warning;
                }
            });
            return { oldWarning: oldWarning, newWarning: newWarning };
        });

        var changedWarning = _.find(combinedForecasts, function (combinedForecast, index) {
            var oldWarning = combinedForecast.oldWarning,
                newWarning = combinedForecast.newWarning;

            if (warningLevelHasChanged(newWarning, oldWarning)) {
                if (index < 2 || (index === 2 && warningLevelHasChangedSignificantly(newWarning, oldWarning))) {
                    return true;
                }
            }
        });

        if (changedWarning && areaID !== -1) {
            if (changedWarning !== undefined && areaID !== -1) {
                var locArgs = [],
                    locArgsOldTemp = [],
                    locArgsNewTemp = [];

                _.each(combinedForecasts, function (combinedForecast, index) {
                    var oldWarning = combinedForecast.oldWarning,
                        newWarning = combinedForecast.newWarning;
                    locArgsOldTemp.push(findOldWarningLevel(oldWarning));
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
        }
    });

    return promise;
}

module.exports = {
    pushUpdates: pushUpdates
};

//        var changedWarning = _.find(newForecast, function (warning, index) {
//            if (warningLevelHasChanged(warning, oldForecast[index])) {
//                if (index < 2
//                        || (index === 2
//                            && warningLevelHasChangedSignificantly(warning, oldForecast[index])
//                           )
//                        ) {
//                    return warning;
//                }
//            }
//        });
//
//
//        if (changedWarning !== undefined && areaID !== -1) {
//            var locArgs = [],
//                locArgsOldTemp = [],
//                locArgsNewTemp = [];
//
//            _.each(newForecast, function (newWarning, index) {
//                locArgsOldTemp.push(findOldWarningLevel(oldForecast[index]));
//                locArgsNewTemp.push(findWarningLevel(newWarning));
//            });
//
//            locArgs.push(area.get("name"));
//            locArgs = locArgs.concat(locArgsOldTemp).concat(locArgsNewTemp);
//
//            var pushQuery = new Parse.Query(Parse.Installation);
//            pushQuery.equalTo('deviceType', 'ios');
//            pushQuery.equalTo('channels', area.className + '-' + areaID);
//            return Parse.Push.send({
//                where: pushQuery,
//                data: {
//                    alert : {
//                        "loc-key": warningType + " forecast changed",
//                        "loc-args": locArgs
//                    },
//                    warningType: warningType,
//                    areaType: area.className,
//                    areaId: areaID
//                }
//            });
//        }
//
//        return Parse.Promise.as();
