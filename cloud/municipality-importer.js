/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var _ = require('underscore');
var config = require('cloud/config.js');

function updateMunicipalityWithJSON(municipality, municipalityJSON) {

    municipality.set('municipalityId', municipalityJSON.Id);
    municipality.set('countyId', municipalityJSON.WarningList[0].CountyList[0].Id);
    municipality.set('name', municipalityJSON.Name);

    return municipality;
}

function updateMunicipalityWithMunicipality(municipality, newMunicipality) {

    municipality.set('countyId', newMunicipality.get('countyId'));
    municipality.set('name', newMunicipality.get('name'));
    return municipality;
}

function createOrUpdateMunicipalities(newMunicipalities) {
    var municipalityQuery = new Parse.Query('Municipality');
    municipalityQuery.limit(1000);

    return municipalityQuery.find().then(function (counties) {

        var promises = [];

        _.each(newMunicipalities, function (newMunicipality) {
            var municipality = _.find(counties, function (municipality) {
                return municipality.get('municipalityId') === newMunicipality.get('municipalityId');
            });

            if (!municipality) {
                municipality = newMunicipality;
            } else {
                municipality = updateMunicipalityWithMunicipality(municipality, newMunicipality);
            }

            promises.push(municipality.save());

        });

        return Parse.Promise.when(promises);
    });
}

function countySummariesJSONToMunicipalities(countySummariesJSON) {
    var municipalities = [];

    _.each(countySummariesJSON, function (countySummaryJSON) {

        var countyId = countySummaryJSON.Id;

        _.each(countySummaryJSON.MunicipalityList, function (municipalitySummaryJSON) {
            var municipality = new Parse.Object('Municipality');
            municipalities.push(updateMunicipalityWithJSON(municipality, municipalitySummaryJSON));
        });

    });

    return Parse.Promise.as(municipalities);
}

function importMunicipalities() {

    return Parse.Cloud.httpRequest({
        url: config.api.urlBase.flood + '/CountySummary/1',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (httpResponse) {
        return countySummariesJSONToMunicipalities(httpResponse.data);
    }).then(function (newMunicipalities) {
        return createOrUpdateMunicipalities(newMunicipalities);
    }).then(function (counties) {
        return Parse.Promise.as('Municipalities import finished successfully');
    }, function (error) {
        return Parse.Promise.error('Municipalities import failed with error ' + JSON.stringify(error));
    });
}

module.exports = {
    importMunicipalities: importMunicipalities
};
