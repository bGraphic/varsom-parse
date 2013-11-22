/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var config = require('cloud/config.js');

var CountyJSONParser = {

    countyJSONToCounty: function (countyJSON) {
        var county = new Parse.Object('County');
        county.set('countyId', countyJSON.Id);
        county.set('name', countyJSON.Name);

        return county;
    },

    countySummariesJSONToCounties: function (countySummariesJSON) {
        var counties = [];

        _.each(countySummariesJSON, function (countySummaryJSON) {
            counties.push(CountyJSONParser.countyJSONToCounty(countySummaryJSON));
        });

        return counties;
    }
};

var CountyObjectSynchronizer = {

    updateCounty: function (county, newCounty) {
        county.set('name', newCounty.get('name'));
        return county;
    },

    createOrUpdateCounties: function (newCounties) {
        var countyQuery = new Parse.Query('County');

        return countyQuery.find().then(function (counties) {

            var promises = [];

            _.each(newCounties, function (newCounty) {
                var county = _.find(counties, function (county) {
                    return county.get('countyId') === newCounty.get('countyId');
                });

                if (!county) {
                    county = newCounty;
                } else {
                    county = CountyObjectSynchronizer.updateCounty(county, newCounty);
                }

                promises.push(county.save());

            });

            return Parse.Promise.when(promises);
        });
    }
};

var CountyDataImporter = {

    importCountiesFromFloodSummaries: function () {

        var countySummariesJSON = {};

        return Parse.Cloud.httpRequest({
            url: config.api.urlBase.flood + '/CountyOverview/1',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (httpResponse) {
            countySummariesJSON = httpResponse.data;
            return CountyJSONParser.countySummariesJSONToCounties(countySummariesJSON);
        }).then(function (newCounties) {
            return CountyObjectSynchronizer.createOrUpdateCounties(newCounties);
        }).then(function (counties) {
            return Parse.Promise.as('Counties import finished successfully');
        }, function (error) {
            return Parse.Promise.error('Counties import failed with error ' + error);
        });
    }

};

Parse.Cloud.job("importCounties", function (request, status) {
    CountyDataImporter.importCountiesFromFloodSummaries(status).then(function (success) {
        status.success(success);
    }, function (error) {
        status.error(error);
    });
});
