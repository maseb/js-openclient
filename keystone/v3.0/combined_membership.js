/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");
    AssignablesHelper = require("./util/assignables_helper");

var assignablesHelper = new AssignablesHelper();

/**
 * Manager-alike which delegates between a {UserProjectMembershipManager} and a {GroupProjectMembershipManager}, based
 * on the provided `assignable_type`.
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
        base.Manager.prototype.safe_complete.call(this, null, results, {status:200}, params, callback);
      });
    }, this));
  },


  get: function() {
    throw new error.NotImplemented();
  },


  create: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.create(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.create(params, callback);
    } else {
      base.Manager.prototype.safe_complete.call(this, new Error("Invalid assignable_type"), null, null, params, callback);
    }
  },

  // TODO: We need a better story around how we deal with partial failure.
  bulkCreate: function(params, callback) {
    console.log("DBG", "raw members", JSON.stringify(params.data.members));
    var mapper = assignablesHelper.parseDisambiguatedId,
        members = _.chain(params.data.members)
          .map(mapper)
          .compact()
          .map(function(assignable) {
            /*
            Map these from `{assignable_type: "group", id: "123"}` to `{assignable_type: "group", group: "123", project: "456"}`, etc
            to make them compatible with #create.
             */
            // Fresh copy of the obj, omitting the original ID (which is user/group ID)
            var data = _.omit(assignable,"id"),
                key = assignable.assignable_type;

            // Group/User ID (now renamed .group or .user)
            data[key] = assignable.id;
            // Proj ID
            data.project = params.data.project;
            // Role ID
            data.id = params.data.id;
            return data;
          })
          .value();
    console.log("DBG", "members", JSON.stringify(members));
    async.mapSeries(members, _.bind(function(member, cb) {
      console.log("DBG", "member", JSON.stringify(member));
      this.create({
        data: member,
        endpoint_type: params.endpoint_type
      }, function(err, res) {
        console.log("DBG", "ERR", err);
        console.log("DBG", "RES", JSON.stringify(res));
        cb(err, res);
      });
    }, this), _.bind(function(err, results) {
      if (err) {
        return base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
        return;
      }
      console.log("DBG", "results", JSON.stringify(results));
      return base.Manager.prototype.safe_complete.call(this, null, null, {status:200}, params, callback);
    }, this));
  },

  del: function(params, callback) {
    var assignable_type = params.data.assignable_type;
    if (assignable_type === "user") {
      this._user_project_memberships.del(params, callback);
    } else if (assignable_type === "group") {
      this._group_project_memberships.del(params, callback);
    } else {
      cb(new Error("Invalid assignable_type"));
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
