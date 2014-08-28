/*global require: false, module: false */

var _                 = require("underscore"),
    async             = require("async"),
    Class             = require("../../client/inheritance").Class,
    base              = require("../../client/base"),
    error             = require("../../client/error"),
    AssignablesHelper = require("./util/assignables_helper");

var assignablesHelper = new AssignablesHelper();

var ProjectAssignableManager = Class.extend({

  init: function(users, groups) {
    this._users = users;
    this._groups = groups;
  },

  all: function(params, callback) {
    async.parallel({
      users: _.bind(function(cb) {
        this._users.all({}, cb)
      }, this),
      groups: _.bind(function(cb) {
        this._groups.all({}, cb);
      }, this)
    }, _.bind(function(err, results) {
      if (err) {
        base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
        return;
      }

      _.each(results.users[0], function(user) {
        user.assignable_type = "user";
        user.disambiguated_id = assignablesHelper.disambiguatedId(user.assignable_type, user.id);
      });

      _.each(results.groups[0], function(group) {
        group.assignable_type = "group";
        group.disambiguated_id = assignablesHelper.disambiguatedId(group.assignable_type, group.id);
      });

      base.Manager.prototype.safe_complete.call(this, null, results.users[0].concat(results.groups[0]), {status:200}, params, callback);
    }, this));
  }
});

module.exports = ProjectAssignableManager;
