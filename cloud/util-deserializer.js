/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var _ = require('underscore');
var oslo = require('cloud/moment-timezone-data-oslo.js');
var moment = require('cloud/moment-timezone.js');
moment.tz.add(oslo);

function parseAsAvalancheProblems(avalancheProblemsJSON) {
  return _.map(avalancheProblemsJSON, function (problemJSON) {
    return {
      problemId: problemJSON.AvalancheProblemId,          // Sort order for avalanche problems
      extId: problemJSON.AvalancheExtId,
      causeId: problemJSON.AvalCauseId,
      probabilityId: problemJSON.AvalProbabilityId,
      triggerSimpleId: problemJSON.AvalTriggerSimpleId,
      destructiveSizeExtId: problemJSON.DestructiveSizeExtId,
      propagationId: problemJSON.AvalPropagationId,
      advice: problemJSON.AvalancheAdvice,
      typeId: problemJSON.AvalancheTypeId,
      problemTypeId: problemJSON.AvalancheProblemTypeId,

      validExpositions: problemJSON.ValidExpositions,

      exposedHeight1: problemJSON.ExposedHeight1,
      exposedHeight2: problemJSON.ExposedHeight2,
      exposedHeightFill: problemJSON.ExposedHeightFill
    };
  }).sort(function (a, b) {
    return a.problemId > b.problemId;
  });
}

function parseAsMicroBlogPosts(microBlogPostsJSON) {
  return _.map(microBlogPostsJSON, function (microBlogPostJSON) {
    return {
      dateTime: microBlogPostJSON.DateTime,
      text: microBlogPostJSON.Text
    };
  }).sort(function (a, b) {
    return a.dateTime < b.dateTime;
  });
}

function parseAsIdArray(listJson) {
  return _.map(listJson, function (entryJson) {
    return entryJson.Id;
  });
}

function parseAsDate(string) {
  return moment.tz(string, "Europe/Oslo").toDate();
}

function parseAsText(string) {
  if (string) {
    return {no: string.trim()};
  } else {
    return {};
  }
}

function parseAsInt(string) {
  return parseInt(string, 10);
}

module.exports = {
  parseAsDate: parseAsDate,
  parseAsText: parseAsText,
  parseAsInt: parseAsInt,
  parseAsIdArray: parseAsIdArray,
  parseAsMicroBlogPosts: parseAsMicroBlogPosts,
  parseAsAvalancheProblems: parseAsAvalancheProblems
};
