Varsom | Parse
============

[The varsom apps](http://github.com/varsom-apps)'s backend.

Responsible for importing data from [api.nve.no](http://api.nve.no).

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
  * Add a parameter with name: `apiEnv`, type: `String`, value: `prod`, `test` or `debug`.
    * `prod` will fetch data from NVE's production api
    * `test` will fetch data from NVE's test api
    * `debug` will fetch data from `http://varsom-debug-data.parseapp.com`*
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
