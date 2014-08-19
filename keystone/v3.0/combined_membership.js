/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");

var ProjectMembershipManager = Class.extend({
  init: function(user_project_memberships_manager, group_project_memberships_manager, role_assignments_manager) {
    this._user_project_memberships_manager = user_project_memberships_manager;
    this._group_project_memberships_manager = group_project_memberships_manager;
    this._role_assignments_manager = role_assignments_manager;
  },

  all: function(params, callback) {
    this._role_assignments_manager.all({
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

  create: function(params, callback) {
    var assignableType = params.data.assignableType;
    if (assignableType === "user") {
      this._user_project_memberships_manager.create(params, callback);
    } else if (assignableType === "group") {
      this._group_project_memberships_manager.create(params, callback);
    } else {
      base.Manager.prototype.safe_complete.call(this, new Error("Invalid assignableType"), null, null, params, callback);
    }
  },

  del: function(params, callback) {
    var assignableType = params.data.assignableType;
    if (assignableType === "user") {
      this._user_project_memberships_manager.del(params, callback);
    } else if (assignableType === "group") {
      this._group_project_memberships_manager.del(params, callback);
    } else {
      cb(new Error("Invalid assignableType"));
    }
  },

  _convertAssignment: function(project, assignment, cb) {
    if (assignment.user) {
      this._user_project_memberships_manager._fetchUserMembership(project, assignment.user, cb);
    } else if (assignment.group) {
      this._group_project_memberships_manager._fetchGroupMembership(project, assignment.group, cb);
    } else {
      cb(new Error("Unhandled assignment type"));
    }
  }

});


module.exports = ProjectMembershipManager;
