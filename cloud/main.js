/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function (request, response) {
    response.success("Hello world!");
});

require('cloud/jobs.js');
