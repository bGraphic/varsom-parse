/*jslint node: true, nomen: true, vars: true, laxbreak: true */
/*global Parse */

'use strict';

var _ = require('underscore'),
    moment = require('moment');

function findWarningLevel(warning) {
    return (warning.has('dangerLevel')) ? warning.get('dangerLevel')
        : (warning.has('activityLevel')) ? warning.get('activityLevel')
            : -1;
}

function findPreviousWarningLevel(warning) {
    return (warning.has('previousDangerLevel')) ? warning.get('previousDangerLevel')
        : (warning.has('previousActivityLevel')) ? warning.get('previousActivityLevel')
            : -1;
}

function warningLevelHasChanged(newLevel, oldLevel) {
    return oldLevel !== "-1"
        && newLevel !== "-1"
        && oldLevel !== newLevel;
}

function areaIDForWarning(warning) {
    return warning.has('regionId') ? warning.get('regionId')
        : warning.has('municipalityId') ? warning.get('municipalityId')
            : warning.has('countyId') ? warning.get('countyId')
                : -1;
}

function parentIDForWarning(warning) {
    return warning.has('countyId') ? warning.get('countyId')
        : null;
}

function avalancheRegionForId(regionId) {
    var query = new Parse.Query("AvalancheRegion");
    query.equalTo("regionId", regionId);
    return query.first();
}

function countyRegionForId(countyId) {
    var query = new Parse.Query("County");
    query.equalTo("countyId", countyId);
    return query.first();
}

function municipalityRegionForId(municipalityId) {
    var query = new Parse.Query("Municipality");
    query.equalTo("municipalityId", municipalityId);
    return query.first();
}

function forecastDaysFromNow(warning) {
    var validToMoment = moment(warning.get("validTo"));
    var nowMoment = moment();
    var forecastDays = validToMoment.diff(nowMoment, 'days', true);

    return Math.floor(forecastDays);
}

function forecastDayAsString(warning) {

    var validToMoment = moment(warning.get("validTo"));
    switch(forecastDaysFromNow(warning))
    {
        case 0:
          return "Today";
        case 1:
          return "Tomorrow";
        default:
          return validToMoment.add('h', 1).format("dddd");
    }
}

function areaForWarning(warning) {
    if (warning.has('regionId')) {
        return avalancheRegionForId(warning.get('regionId'));
    } else if (warning.has('municipalityId')) {
        return municipalityRegionForId(warning.get('municipalityId'));
    } else if (warning.has('countyId')) {
        return countyRegionForId(warning.get('countyId'));
    }
}

function pushQueryForAreaClassnameAndId(className, areaId) {
    var query = new Parse.Query(Parse.Installation);
    query.equalTo('deviceType', 'ios');
    query.equalTo('channels', className + "-" + areaId);
    return query;
}

function pushWarningUpdate(warningType, warning) {
    var currentLevel = findWarningLevel(warning),
        previousLevel = findPreviousWarningLevel(warning),
        forecastDays = forecastDaysFromNow(warning);

    if (forecastDays < 2 && warningLevelHasChanged(currentLevel, previousLevel)) {

        areaForWarning(warning).then(function (area) {
            if (area !== undefined) {
                return Parse.Push.send({
                    expiration_interval: 43200, //12 hours
                    where: pushQueryForAreaClassnameAndId(area.className, areaIDForWarning(warning)),
                    data: {
                        alert: {
                            "loc-key": warningType + " forecast changed " + forecastDayAsString(warning),
                            "loc-args": [
                                area.get("name"),
                                previousLevel,
                                currentLevel
                            ]
                        },
                        warningType: ""+warningType,
                        areaType: ""+area.className,
                        areaId: ""+areaIDForWarning(warning),
                        parentId: ""+parentIDForWarning(warning)
                    }
                }).then(function () {}, function (error) {
                    console.error("Error pushing warning: " + JSON.stringify(error));
                });
            }
        });
    }
}

module.exports = {
    pushWarningUpdate: pushWarningUpdate
};
