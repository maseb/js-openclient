/*global require: false, module: false */

var _           = require("underscore"),
  Class       = require("../../client/inheritance").Class,
  async       = require('async'),
  base        = require("../../client/base"),
  error       = require("../../client/error"),
  interpolate = require("../../client/utils").interpolate;

var IDENTITY_MAPPER = function(a) { return a; };

var CompositeManager = Class.extend({
  /**
   *
   */
  init: function(delegates) {
    // Expected to be an array of objects:
    // `[{manager: manager, map: map}]`
    //
    this._delegates = delegates;
  },
  all: function(passthruParams, callback) {
    var params = {
      success: passthruParams.success,
      error: passthruParams.error
    };
    delete passthruParams.success;
    delete passthruParams.error;

    async.parallel(_.map(this._delegates, function(delegate) {
      var mapper = delegate.map || IDENTITY_MAPPER;
      return function(delegate, cb) {
        // Have to clone the params, since these managers are dirty and don't make
        // copies before modifying and passing off to the client.
        // Failing to clone will result in cross-calls (fetching one resource, e.g., groups,
        // but calling it another, e.g., users).
        delegate.manager.all(_.clone(passthruParams), function(err, results) {
          if (err) {
            cb(err);
            return;
          }
          console.log(delegate.manager.namespace);
          console.log("Direct result", _.map(results, mapper));
          cb(null, _.map(results, mapper));
        });
      }.bind(null, delegate);
    }), function(err, resultsSet) {
      console.log("RESULTS SET", resultsSet);
      // Not much the caller can do with the raw response JSON, so we'll purposefully drop it here.
      // Just grab the items
      var finalResults =  resultsSet && _.flatten(resultsSet) || [];

      base.Manager.prototype.safe_complete.call(this, err, finalResults, null, params, callback);
    });
  }
});


module.exports = CompositeManager;
