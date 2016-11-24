/*jslint node: true, nomen: true, vars: true */
/*global Parse, unescape */

'use strict';

// Check if there are new versions of app and if they are required
Parse.Cloud.define("check_app_version", function (request, response) {
  var current_version = request.params.currentVersion;
  if (!current_version) {
    response.error(0, "Required parameter: currentVersion");
    return;
  }

  var versionQuery = new Parse.Query("AppVersion");
  versionQuery.greaterThan("version", current_version);
  versionQuery.find({
    success: function (versions) {
      if (!versions.length) {
        response.success({
          updateAvailable: false
        });
        return;
      }

      var required = false;

      for (i = 0; i < versions.length; i++) {
        if (versions[i].get("required")) {
          required = true;
        }
      }

      var latestVersion = versions[versions.length - 1];
      var availableVersionString = latestVersion.get("version");

      response.success({
        updateAvailable: true,
        updateRequired: required,
        availableVersion: availableVersionString
      });

    },
    error: function (error) {
      response.error(error.message);
    }
  });
});
