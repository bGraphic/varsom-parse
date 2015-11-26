/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var _ = require('underscore');
var Warning = require('cloud/model-warning.js');

function findWarningInForecast(warning, forecast) {
  return _.find(forecast, function (forecastWarning) {
    return forecastWarning.isSameWarning(warning);
  });
}

function mergeCurrentForecastWithNewForecast(currentForecast, newForecast) {
  return _.map(newForecast, function (newWarning) {
    var currentWarning = findWarningInForecast(newWarning, currentForecast);
    if (currentWarning) {
      currentWarning.updateAttributesFromAnotherWarning(newWarning);
      return currentWarning;
    } else {
      return newWarning;
    }
  });
}

function highestForecastLevel(forecast) {
  var highestLevel = -1;
  _.each(forecast, function (warning) {
    if (warning.has('activityLevel') && warning.get('activityLevel') > highestForecastLevel) {
      highestLevel = warning.get('activityLevel');
    } else if (warning.has('dangerLevel') && warning.get('dangerLevel') > highestForecastLevel) {
      highestLevel = warning.get('dangerLevel');
    }
  });
  return highestLevel;
}

function microBlogPostsHaveChanged(currentForecast, newForecast) {

  function warningHasMicroBlogPosts(warning) {
    if (!warning) {
      return false;
    }

    var warningMicroBlogPosts = warning.get('microBlogPosts');
    return warningMicroBlogPosts && warningMicroBlogPosts.length > 0;
  }

  function onlyNewWarningHasMicroBlogPosts(existingWarning, newWarning) {
    return !warningHasMicroBlogPosts(existingWarning) && warningHasMicroBlogPosts(newWarning);
  }

  function newWarningHasNewerMicroBlogPostsThanExistingWarning(existingWarning, newWarning) {
    if (!warningHasMicroBlogPosts(existingWarning) || !warningHasMicroBlogPosts(newWarning)) {
      return false;
    }

    var newWarningMicroBlogPosts = newWarning.get('microBlogPosts');
    var existingWarningMicroBlogPosts = existingWarning.get('microBlogPosts');

    // The micro blogposts are sorted in the deserializer
    return newWarningMicroBlogPosts[0].dateTime > existingWarningMicroBlogPosts[0].dateTime;
  }

  var hasChanged = _.find(newForecast, function (newWarning) {
      var existingWarning = findWarningInForecast(newWarning, currentForecast);

      return onlyNewWarningHasMicroBlogPosts(existingWarning, newWarning)
          || newWarningHasNewerMicroBlogPostsThanExistingWarning(existingWarning, newWarning);
    });

  return hasChanged !== undefined;

}

function highestPriorityAvalancheProblemHasChanged(currentForecast, newForecast) {

  function avalancheProblemHasChanged(existingProblem, newProblem) {
    return existingProblem.causeId !== newProblem.causeId
      || existingProblem.problemTypeId !== newProblem.problemTypeId;
  }

  var hasChanged = _.find(newForecast, function (newWarning) {
    var existingWarning = findWarningInForecast(newWarning, currentForecast);

    if (!existingWarning) {
      return false;
    }

    var existingWarningAvalancheProblems = existingWarning.get('avalancheProblems');
    var newWarningAvalancheProblems = newWarning.get('avalancheProblems');

    // The micro blogposts are sorted in the deserializer
    return existingWarningAvalancheProblems.length > 0
            && newWarningAvalancheProblems.length > 0
            && avalancheProblemHasChanged(existingWarningAvalancheProblems[0], newWarningAvalancheProblems[0]);
  });

  return hasChanged !== undefined;
}

var Area = Parse.Object.extend("Area", {
  // Instance methods
  setAttributesNeededByPush: function (newForecast, warningType) {
    var currentForecast = this.get(warningType + "Forecast");

    this.set(warningType + 'NewHighestForecastLevel', highestForecastLevel(newForecast));
    if (!this.has(warningType + 'HighestForecastLevel')) {
      this.set(warningType + 'HighestForecastLevel', highestForecastLevel(newForecast));
    }

    if (this.has('regionId')) {
      this.set("highestPriorityAvalancheProblemHasChanged",
               highestPriorityAvalancheProblemHasChanged(currentForecast, newForecast));
    } else if (this.has('municipalityId')) {
      this.set(warningType + "MicroBlogPostsHaveChanged",
               microBlogPostsHaveChanged(currentForecast, newForecast));
    }
  },
  udpdateForecast: function (newForecast, warningType) {
    var currentForecast = this.get(warningType + "Forecast");
    this.set(warningType + 'Forecast', mergeCurrentForecastWithNewForecast(currentForecast, newForecast));
  }
}, {
  // Class methods
  baseQuery: function () {
    var query = new Parse.Query(this);
    query.limit(1000);
    return query;
  }
});

module.exports = Area;
