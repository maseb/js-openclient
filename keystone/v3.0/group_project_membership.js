/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");

/**
 * "group project" memberships are lighter-weight than their "project group" counterparts. They're a
 * minimal grouping and transformation of {RoleAssignments}
 *
 * @type {GroupProjectMembershipManager}
 */
var GroupProjectMembershipManager = Class.extend({
  init: function(role_assignments) {
    this._role_assignments  = role_assignments;
  },


  all: function(params, callback) {
    this._role_assignments.all({
      query: {
        "group.id": params.data.group
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        return base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
      }

      var memberships = _.chain(assignments).filter(function(assignment) {
        return assignment.group && assignment.scope.project;
      }).groupBy(function(assignment) {
        return assignment.scope.project.id;
      }).map(function(assignments, project_id) {
        return {
          id: project_id,
          group: params.data.group,
          roles: _.map(assignments, function(a) { return {id: a.role.id } })
        };
      }).value();

      console.log("DBG: Memberships", JSON.stringify(memberships));

      base.Manager.prototype.safe_complete.call(this, err, memberships, {status:200}, params, callback);
    }, this));
  },


  get: function() {
    throw new error.NotImplemented();
  },


  create: function() {
    throw new error.NotImplemented();
  },


  update: function() {
    throw new error.NotImplemented();
  },


  del: function() {
    throw new error.NotImplemented();
  }

});


module.exports = GroupProjectMembershipManager;
