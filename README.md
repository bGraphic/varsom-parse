Varsom | Parse
============

Parse backend for varsom-ios and varsom-hybrid. 
* Imports warnings from the api.nve.no
* Manages push notofocations

= Config = 

== Import ==
The api urls to import from is managed by Parse.Config.

=== Test api import configurations ===
* _avalancheApiUrl_: http://h-web03.nve.no/Avalanche_Test/api/RegionSummary/Detail/1
* _floodApiUrl_: http://h-web03.nve.no/flood_test/api/CountySummary/1
* _landslideApiUrl_: http://h-web03.nve.no/landslide_test/api/CountySummary/1


[The varsom apps](http://github.com/varsom-apps)'s backend.
=======

Responsible for importing data displayed by the client apps. 

The api being used is controlled by the api urls given in the Parse app config section.
There is one parameter for each warning type.

* Parameter: `AvalancheApiUrl`, type: `String` 
* Parameter: `FloodApiUrl`, type: `String`
* Parameter: `LandSlideApiUrl`, type: `String`

**Debug**
* AvalancheApiUrl: `http://varsom-debug-data.parseapp.com/avalanche/RegionSummary/Detail/1`
* FloodApiUrl: `http://varsom-debug-data.parseapp.com/flood/CountySummary/1`
* LandSlideApiUrl: `http://varsom-debug-data.parseapp.com/landslide/CountySummary/1`

**Test**
* AvalancheApiUrl: `http://h-web03.nve.no/Avalanche_Test/api/RegionSummary/Detail/1`
* FloodApiUrl: `http://h-web03.nve.no/flood_test/api/CountySummary/1`
* LandSlideApiUrl: `http://h-web03.nve.no/landslide_test/api/CountySummary/1`

**Prod**
* AvalancheApiUrl: `http://api01.nve.no/hydrology/forecast/avalanche/v2.0.2/api/RegionSummary/Detail/1`
* FloodApiUrl: ` http://api01.nve.no/hydrology/forecast/flood/v1.0.3/api/CountySummary/1`
* LandSlideApiUrl: `http://api01.nve.no/hydrology/forecast/landslide/v1.0.3/api/CountySummary/1`


# Getting started

* Clone and create a global.json file in a folder named config:

``` 
git clone https://github.com/bGraphic/varsom-parse.git
cd varsom-parse
mkdir config
cd config
touch global.json

```
* Populate global.json with the appropriate keys in the following format:

``` 
{
    "applications": {
        "_default": {
            "link": "varsom-dev"
        },
        "varsom-prod": {
            "applicationId": "",
            "javascriptKey": "",
            "masterKey": ""
        },
        "varsom-beta": {
            "applicationId": "",
            "javascriptKey": "",
            "masterKey": ""
        },
        "varsom-test": {
            "applicationId": "",
            "javascriptKey": "",
            "masterKey": ""
        },
        "varsom-dev": {
            "applicationId": "",
            "javascriptKey": "",
            "masterKey": ""
        }
    },
    "global": {
        "parseVersion": "1.3.1"
    }
}

```
  * Ask benedicte@lillylabs.no for the appropriate keys for prod, beta and test.
  * Create your own Parse app to use in development, see below.

## How to create your Parse dev app

1. Create a parse account: https://www.parse.com/signup
2. Create a new project: https://www.parse.com/apps/new
3. Add your parse app keys to global.json.
  * Keys can be found under settings -> keys
4. Deploy to parse: `parse deploy varsom-dev`

### Import initial data
1. Configure the apiEnv Parse config parameter
  * Go to Core -> Config in you Parse app
  * Add the parameters: `AvalancheApiUrl`, `FloodApiUrl` and `LandSlideApiUrl`. 
    * See above for possible values.
2. Import areas: counties, municipalities and avalanche regions by running these jobs: 
  * `importCounties`
  * `importMunicipalities`
  * `importRegions`
3. Import initial set of warnings data by running these jobs:
  * `importFloodWarnings`
  * `importLandSlideWarnings`
  * `importAvalancheWarnings`
4. Import geojson files for counties and avalanche regions:
  * TODO
5. Import sort order for avalanche regions:
  * TODO

\* This is an app set up by Lilly Labs to serve debug data. The code can be found
    in this github project: [varsom-debug-data-app](https://github.com/bGraphic/varsom-debug-data-app).
    
## Branching
The project follows the [git flow branching model](http://nvie.com/posts/a-successful-git-branching-model/) 
by using the [git flow git extention](https://github.com/nvie/gitflow).

## Deployment
Deployment is done by using parse deploy.

**Prod:**  
`parse deploy varsom-prod`  

**Beta:**  
`parse deploy varsom-beta`

**Test:**  
`parse deploy varsom-test`

**Dev:**   
`parse deploy varsom-dev`
