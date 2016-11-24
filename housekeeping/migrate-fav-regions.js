#! /usr/bin/env node

/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

var Globals = require('../config/global.json');
var Parse = require('parse/node').Parse;

var _ = require('underscore');

var env = process.argv[2];
if (!env) {
    env = Globals.applications._default.link;
}

var regionMapping = [
    {
      "name": "Sunnmøre",
      "regionId": 19,
      "newRegions": [
        {
          "id": 3024,
          "name": "Sunnmøre"
        }
      ]
    },
    {
      "name": "Narvik",
      "regionId": 14,
      "newRegions": [
        {
          "id": 3015,
          "name": "Ofoten"
        }
      ]
    },
    {
      "name": "Hallingdal",
      "regionId": 32,
      "newRegions": [
        {
          "id": 3032,
          "name": "Hallingdal"
        }
      ]
    },
    {
      "name": "Senja",
      "regionId": 10,
      "newRegions": [
        {
          "id": 3012,
          "name": "Sør-Troms"
        }
      ]
    },
    {
      "name": "Alta",
      "regionId": 6,
      "newRegions": [
        {
          "id": 3007,
          "name": "Vest-Finnmark"
        }
      ]
    },
    {
      "name": "Rauland",
      "regionId": 28,
      "newRegions": [
        {
          "id": 3035,
          "name": "Vest-Telemark"
        }
      ]
    },
    {
      "name": "Bardu",
      "regionId": 12,
      "newRegions": [
        {
          "id": 3013,
          "name": "Indre Troms"
        },
        {
          "id": 3012,
          "name": "Sør-Troms"
        }
      ]
    },
    {
      "name": "Tromsø",
      "regionId": 8,
      "newRegions": [
        {
          "id": 3011,
          "name": "Tromsø"
        }
      ]
    },
    {
      "name": "Romsdal",
      "regionId": 18,
      "newRegions": [
        {
          "id": 3023,
          "name": "Romsdal"
        }
      ]
    },
    {
      "name": "Kåfjord",
      "regionId": 7,
      "newRegions": [
        {
          "id": 3009,
          "name": "Nord-Troms"
        }
      ]
    },
    {
      "name": "Vesterålen",
      "regionId": 15,
      "newRegions": [
        {
          "id": 3014,
          "name": "Lofoten og Vesterålen"
        },
        {
          "id": 3012,
          "name": "Sør-Troms"
        }
      ]
    },
    {
      "name": "Salten",
      "regionId": 33,
      "newRegions": [
        {
          "id": 3016,
          "name": "Salten"
        }
      ]
    },
    {
      "name": "Fjordane",
      "regionId": 21,
      "newRegions": [
        {
          "id": 3027,
          "name": "Indre Fjordane"
        },
        {
          "id": 3026,
          "name": "Ytre Fjordane"
        }
      ]
    },
    {
      "name": "Lyngsalpan",
      "regionId": 11,
      "newRegions": [
        {
          "id": 3010,
          "name": "Lyngen"
        }
      ]
    },
    {
      "name": "Røldal",
      "regionId": 27,
      "newRegions": [
        {
          "id": 3034,
          "name": "Hardanger"
        }
      ]
    },
    {
      "name": "Lofoten",
      "regionId": 16,
      "newRegions": [
        {
          "id": 3014,
          "name": "Lofoten og Vesterålen"
        }
      ]
    },
    {
      "name": "Trollheimen",
      "regionId": 17,
      "newRegions": [
        {
          "id": 3022,
          "name": "Trollheimen"
        }
      ]
    },
    {
      "name": "Svartisen",
      "regionId": 31,
      "newRegions": [
        {
          "id": 3017,
          "name": "Svartisen"
        }
      ]
    },
    {
      "name": "Voss",
      "regionId": 24,
      "newRegions": [
        {
          "id": 3031,
          "name": "Voss"
        }
      ]
    },
    {
      "name": "Jotunheimen",
      "regionId": 23,
      "newRegions": [
        {
          "id": 3028,
          "name": "Jotunheimen"
        }
      ]
    },
    {
      "name": "Nordenskioldland",
      "regionId": 30,
      "newRegions": [
        {
          "id": 3003,
          "name": "Nordenskiöld Land"
        }
      ]
    },
    {
      "name": "Balsfjord",
      "regionId": 9,
      "newRegions": [
        {
          "id": 3010,
          "name": "Lyngen"
        },
        {
          "id": 3013,
          "name": "Indre Troms"
        }
      ]
    },
    {
      "name": "Sogn",
      "regionId": 22,
      "newRegions": [
        {
          "id": 3029,
          "name": "Indre Sogn"
        }
      ]
    },
    {
      "name": "Tamokdalen",
      "regionId": 29,
      "newRegions": [
        {
          "id": 3013,
          "name": "Indre Troms"
        }
      ]
    }
  ];

var ParseAppKeys = Globals.applications[env];

Parse.initialize(ParseAppKeys.applicationId, ParseAppKeys.javascriptKey, ParseAppKeys.masterKey);
Parse.Cloud.useMasterKey();

function migrateInstallations(skip) {
  var avalancheInstallationQuery = new Parse.Query(Parse.Installation);
  avalancheInstallationQuery.skip(skip);
  avalancheInstallationQuery.limit(1000);
  return avalancheInstallationQuery.find().then(function (installations) {

    var promise = Parse.Promise.as();

    _.each(installations, function(installation) {
      var channels = installation.get("channels");
      console.log("Installation: ", installation.id);

      _.each(channels, function(channel) {
        if(channel.includes("AvalancheRegion-")) {
          var originalRegionId = channel.replace("AvalancheRegion-", "");
          if(originalRegionId < 3000) {
            console.log("Mapping: original region", originalRegionId);

            var regionMapIndex = _.findIndex(regionMapping, function(regionMap) {
              return regionMap.regionId == originalRegionId;
            });

            if(regionMapIndex > -1) {
              _.each(regionMapping[regionMapIndex].newRegions, function(newRegion) {
                installation.addUnique("channels", "AvalancheRegion-" + newRegion.id);
                console.log("Mapping: new region", newRegion.id, newRegion.name);
              });
            } else {
              console.log("Mapping: No new regions for", originalRegionId);
            }
          }
        }
      });

      promise = promise.then(function() {
        installation.save().then(function(installation) {
          console.log("Installation: Saved", installation.id);
          return Parse.as();
        }, function(error) {
          console.log("Mapping: Saving failed", installation.id, error);
          return Parse.as();
        });
      });

    });

    return promise;

  }, function (error) {

    console.log("Installation query failed because of ", error.message);

  });
}

migrateInstallations(0).then(function() {
  console.log("Migration of all installations done.");
});

migrateInstallations(1000).then(function() {
  console.log("Migration of all installations done.");
});
