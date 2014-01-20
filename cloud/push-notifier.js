/*jslint node: true, nomen: true */
/*global Parse */

'use strict';

var _ = require('underscore'),
    SIGNIFICANT_CHANGE_OLD_LEVEL = 0,
    SIGNIFICANT_CHANGE_THRESHOLD = 1;


// This function may be needed in processWarningsModule
//function isSameWarning(newWarning, oldWarning) {
//    return newWarning.get('validFrom').getTime() === oldWarning.get('validFrom').getTime() && newWarning.get('validTo').getTime() === oldWarning.get('validTo').getTime();
//}

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
    return oldLevel !== -1
        && newLevel !== -1
        && oldLevel !== newLevel;
}

function warningLevelHasChangedSignificantly(newLevel, oldLevel) {
    return oldLevel === SIGNIFICANT_CHANGE_OLD_LEVEL
        && newLevel > SIGNIFICANT_CHANGE_THRESHOLD;
}

function areaIDForWarning(warning) {
    return warning.has('regionId') ? warning.get('regionId')
        : warning.has('countyId') ? warning.get('countyId')
            : warning.has('municipalityId') ? warning.get('municipalityId')
                : -1;
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

// We need some logic to determine wether a warning is for a county or a municipality
function areaForWarningTypeAndAreaId(warningType, areaId) {
    if (warningType === 'AvalancheWarning') {
        return avalancheRegionForId(areaId);
    } else {
        return countyRegionForId(areaId);
    }   
}

function pushQueryForAreaClassnameAndId(className, areaId) {
    var query = new Parse.Query(Parse.Installation);
    query.equalTo('deviceType', 'ios');
    query.equalTo('channels', className + areaId);
    return query;
}

function pushWarningUpdate(warningType, warning) {
    var currentLevel = findWarningLevel(warning),
        previousLevel = findPreviousWarningLevel(warning),
        areaId = areaIDForWarning(warning),
        forecastDay = warning.get("forecastDay");
    
    if (warningLevelHasChanged(currentLevel, previousLevel)) {
        if (forecastDay < 2 
            || (forecastDay === 2 
                && warningLevelHasChangedSignificantly(currentLevel, previousLevel))) {
            
            areaForWarningTypeAndAreaId(warningType, areaId).then(function (area) {
                if (area !== undefined) {
                    return Parse.Push.send({
                        where: pushQueryForAreaClassnameAndId(area.className, areaId),
                        data: {
                            alert: {
                                "loc-key": warningType + " forecast changed",
                                "loc-args": [
                                    forecastDay, 
                                    area.get("name"), 
                                    previousLevel, 
                                    currentLevel
                                ]
                            },
                            warningType: warningType,
                            areaType: area.className,
                            areaId: areaId
                        }
                    }).then(function () {}, function (error) {
                        console.error("Error pushing warning: " + JSON.stringify(error));
                    });
                }
            });
        }
    }
}

module.exports = {
    pushWarningUpdate: pushWarningUpdate
};
