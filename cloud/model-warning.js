/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var deserializer = require('cloud/util-deserializer.js');

var Warning = Parse.Object.extend('Warning', {
  // instance methods
  updateAttributesFromWarningJson: function (warningJson) {
    this.set('validFrom', deserializer.parseAsDate(warningJson.ValidFrom));
    this.set('validTo', deserializer.parseAsDate(warningJson.ValidTo));

    this.set('publishTime', deserializer.parseAsDate(warningJson.PublishTime));
    this.set('nextWarningTime', deserializer.parseAsDate(warningJson.NextWarningTime));

    this.set('mainText', deserializer.parseAsText(warningJson.MainText));

    if (warningJson.RegionId) {
      // Is avalanche warning

      this.set('dangerLevel', deserializer.parseAsInt(warningJson.DangerLevel));
      this.set('avalancheWarning', deserializer.parseAsText(warningJson.AvalancheWarning));
      this.set('avalancheDanger', deserializer.parseAsText(warningJson.AvalancheDanger));
      this.set('alpineWeather', deserializer.parseAsText(warningJson.AlpineWeather));
      this.set('emergencyWarning', deserializer.parseAsText(warningJson.EmergencyWarning));
      this.set('avalancheProblems', deserializer.parseAsAvalancheProblems(warningJson.AvalancheProblems));

    } else {
      // Is flood or landslide warning
      this.set('activityLevel', deserializer.parseAsInt(warningJson.ActivityLevel));
      this.set('warningText', deserializer.parseAsText(warningJson.WarningText));
      this.set('exposedHeightType', warningJson.ExposedHeightType);
      this.set('exposedHeightValue', warningJson.ExposedHeightValue);

      this.set('causeList', deserializer.parseAsIdArray(warningJson.CauseList));
      this.set('microBlogPosts', deserializer.parseAsMicroBlogPosts(warningJson.MicroBlogPostList));

      if (warningJson.LandSlideTypeList) {
        this.set('typeList', deserializer.parseAsIdArray(warningJson.LandSlideTypeList));
      }
    }
  },
  updateAttributesFromAnotherWarning: function (warning) {
    this.set('publishTime',      warning.get('publishTime'));
    this.set('nextWarningTime',  warning.get('nextWarningTime'));

    if (warning.has('regionId')) {
      // Is avalanche warning

      this.set('dangerLevel',          warning.get('dangerLevel'));
      this.set('mainText',             warning.get('mainText'));
      this.set('avalancheWarning',     warning.get('avalancheWarning'));
      this.set('avalancheDanger',      warning.get('avalancheDanger'));
      this.set('alpineWeather',        warning.get('alpineWeather'));
      this.set('emergencyWarning',     warning.get('emergencyWarning'));
      this.set('avalancheProblems',    warning.get('avalancheProblems'));
      this.set('highestPriorityAvalancheProblem', warning.get('highestPriorityAvalancheProblem'));

    } else {
      // Is flood or landslide warning

      this.set('municipalityId',           warning.get('municipalityId'));
      this.set('activityLevel',            warning.get('activityLevel'));
      this.set('mainText',                 warning.get('mainText'));
      this.set('warningText',              warning.get('warningText'));
      this.set('exposedHeightType',        warning.get('exposedHeightType'));
      this.set('exposedHeightValue',       warning.get('exposedHeightValue'));
      this.set('causeList',                warning.get('causeList'));
      this.set('microBlogPosts',        warning.get('microBlogPosts'));

      if (warning.has('typeList')) {
        this.set('typeList', warning.get('typeList'));
      }
    }
  }
}, {
  // class methods

});

module.exports = Warning;
