/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");

/**
 * Manager-alike which delegates between a {UserProjectMembershipManager} and a {GroupProjectMembershipManager}, based
 * on the provided `assignableType`.
 * @type {ProjectMembershipManager}
 */
var ProjectMembershipManager = Class.extend({
  init: function(user_project_memberships, group_project_memberships, role_assignments) {
    this._user_project_memberships = user_project_memberships;
    this._group_project_memberships = group_project_memberships;
    this._role_assignments = role_assignments;
  },


  all: function(params, callback) {
    this._role_assignments.all({
      query: {
       "scope.project.id": params.data.project
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        return base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
      }

      async.map(assignments, _.bind(this._convertAssignment, this, params.data.project), function(err, results) {
        base.Manager.prototype.safe_complete.call(this, err, results, null, params, callback);
      });
    }, this));
  },


  get: function() {
    throw new error.NotImplemented();
  },


  create: function(params, callback) {
    var assignableType = params.data.assignableType;
    if (assignableType === "user") {
      this._user_project_memberships.create(params, callback);
    } else if (assignableType === "group") {
      this._group_project_memberships.create(params, callback);
    } else {
      base.Manager.prototype.safe_complete.call(this, new Error("Invalid assignableType"), null, null, params, callback);
    }
  },


  del: function(params, callback) {
    var assignableType = params.data.assignableType;
    if (assignableType === "user") {
      this._user_project_memberships.del(params, callback);
    } else if (assignableType === "group") {
      this._group_project_memberships.del(params, callback);
    } else {
      cb(new Error("Invalid assignableType"));
    }
  },


  update: function() {
    throw new error.NotImplemented();
  },


  _convertAssignment: function(project, assignment, cb) {
    if (assignment.user) {
      this._user_project_memberships._fetchUserMembership(project, assignment.user, cb);
    } else if (assignment.group) {
      this._group_project_memberships._fetchGroupMembership(project, assignment.group, cb);
    } else {
      cb(new Error("Unhandled assignment type"));
    }
  }

});


module.exports = ProjectMembershipManager;
