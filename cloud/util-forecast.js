/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var _ = require('underscore');

function findWarningInForecast(warning, forecast) {
  return _.find(forecast, function (forecastWarning) {
    return forecastWarning.isSameWarning(warning);
  });
}

function mergeForecastWithNewForecast(forecast, newForecast) {
  return _.map(newForecast, function (newWarning) {
    var warning = findWarningInForecast(newWarning, forecast);
    if (warning) {
      warning.updateAttributesFromAnotherWarning(newWarning);
      return warning;
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

function updateForecastIfNewForecastHasHigherLevel(forecast, newForecast) {
  _.each(newForecast, function (warning, i) {
    if (i > forecast.length - 1) {
      forecast.push(warning);
    } else if (warning.get("activityLevel") > forecast[i].get("activityLevel")) {
      forecast[i] = warning;
    }
  });
  return forecast;
}

module.exports = {
  highestForecastLevel: highestForecastLevel,
  mergeForecastWithNewForecast: mergeForecastWithNewForecast,
  updateForecastIfNewForecastHasHigherLevel: updateForecastIfNewForecastHasHigherLevel,
  highestPriorityAvalancheProblemHasChanged: highestPriorityAvalancheProblemHasChanged,
  microBlogPostsHaveChanged: microBlogPostsHaveChanged
};

