/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */
'use strict';

var _ = require('underscore');
var Area = require('cloud/model-area.js');

var AvalancheRegion = Area.extend("AvalancheRegion", {
  // Instance methods
}, {
  // Class methods
  queryForRegionWithId: function (regionId) {
    var regionQuery = this.baseQuery();
    regionQuery.equalTo('regionId', regionId);
    regionQuery.include('AvalancheForecast');
    return regionQuery.first();
  }

});

module.exports = AvalancheRegion;
