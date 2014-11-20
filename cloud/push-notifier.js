/*jslint node: true, nomen: true, vars: true, laxbreak: true */
/*global Parse */

'use strict';

var _ = require('underscore'),
    moment = require('moment');

function findHighestForecastLevel(area, warningType) {
    return (area.has(warningType + 'HighestForecastLevel')) ? area.get(warningType + 'HighestForecastLevel') : -1;
}

function findNewHighestForecastLevel(area, warningType) {
    return (area.has(warningType + 'NewHighestForecastLevel')) ? area.get(warningType + 'NewHighestForecastLevel') : -1;
}

function setCurrentToNewForecastLevel(area, warningType, newLevel) {
  if(newLevel != -1) {
      area.set(warningType + 'HighestForecastLevel', newLevel);
  }
}

function unsetNewForcastLevel(area, warningType) {
    area.unset(warningType + 'NewHighestForecastLevel');
}

function highestForecastLevelHasChanged(currentLevel, newLevel) {
    return newLevel != -1
        && currentLevel != -1
        && newLevel != currentLevel;
}

function areaIDForArea(area) {
    return area.has('regionId') ? area.get('regionId')
        : area.has('municipalityId') ? area.get('municipalityId')
            : area.has('countyId') ? area.get('countyId')
                : -1;
}

function parentIDForArea(area) {
    return area.has('countyId') ? area.get('countyId')
        : null;
}

function pushQueryForAreaClassnameAndId(className, areaId) {
    console.log("Push query: " + className + " " + areaId);
    var query = new Parse.Query(Parse.Installation);
    query.equalTo('deviceType', 'ios');
    query.equalTo('channels', className + "-" + areaId);
    return query;
}

function pushHighestForecastLevelUpdate(area, warningType) {
    var currentLevel = findHighestForecastLevel(area, warningType),
        newLevel = findNewHighestForecastLevel(area, warningType);

    unsetNewForcastLevel(area, warningType);

    if(highestForecastLevelHasChanged(currentLevel, newLevel)) {

        return Parse.Push.send({
            expiration_interval: 43200, //12 hours
            where: pushQueryForAreaClassnameAndId(area.className, areaIDForArea(area)),
            data: {
                alert: {
                    "loc-key": warningType + " forecast changed",
                    "loc-args": [
                        area.get("name"),
                        currentLevel,
                        newLevel
                    ]
                },
                warningType: ""+warningType,
                areaType: ""+area.className,
                areaId: ""+areaIDForArea(area),
                parentId: ""+parentIDForArea(area)
            }
        }).always(function(result) {
            setCurrentToNewForecastLevel(area, warningType, newLevel);

            if((result instanceof Parse.Error)) {
                console.error("Error pushing warning level change: " + JSON.stringify(result));
            }

            return Parse.Promise.as();
        });

    } else {
        return Parse.Promise.as();
    }
}

function pushHighestPriorityAvalancheProblemHasChangedUpdate(area) {
    if (area.get("highestPriorityAvalancheProblemHasChanged")) {

        return Parse.Push.send({
          expiration_interval: 43200, //12 hours
          where: pushQueryForAreaClassnameAndId(area.className, areaIDForArea(area)),
          data: {
              alert: {
                  "loc-key": "AvalancheWarning problem changed",
                  "loc-args": [
                      area.get("name")
                  ]
              },
              warningType: "AvalancheWarning",
              areaType: ""+area.className,
              areaId: ""+areaIDForArea(area),
              parentId: ""+parentIDForArea(area)
          }
      }).always(function(result) {
          area.set("highestPriorityAvalancheProblemHasChanged", false);

          if((result instanceof Parse.Error)) {
              console.error("Error pushing problem : " + JSON.stringify(result));
          }

          return Parse.Promise.as();
      });

    } else {
        return Parse.Promise.as();
    }
}

function pushMicroBlogPostsUpdate(area, warningType) {
    if (area.get(warningType + "MicroBlogPostsHaveChanged")) {

        return Parse.Push.send({
          expiration_interval: 43200, //12 hours
          where: pushQueryForAreaClassnameAndId(area.className, areaIDForArea(area)),
          data: {
              alert: {
                  "loc-key": warningType + " MicroBlogPosts have changed",
                  "loc-args": [
                      area.get("name")
                  ]
              },
              warningType: warningType,
              areaType: ""+area.className,
              areaId: ""+areaIDForArea(area),
              parentId: ""+parentIDForArea(area)
          }
      }).always(function(result) {
          area.set(warningType + "MicroBlogPostsHaveChanged", false);

          if((result instanceof Parse.Error)) {
              console.error("Error pushing micro blog post change: " + JSON.stringify(result));
          }

          return Parse.Promise.as();
      });

    } else {
        return Parse.Promise.as();
    }
}

module.exports = {
    pushHighestForecastLevelUpdate: pushHighestForecastLevelUpdate,
    pushHighestPriorityAvalancheProblemHasChangedUpdate: pushHighestPriorityAvalancheProblemHasChangedUpdate,
    pushMicroBlogPostsUpdate: pushMicroBlogPostsUpdate
};
