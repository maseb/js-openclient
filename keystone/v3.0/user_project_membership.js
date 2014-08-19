/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base");

var UserProjectMembershipManager = Class.extend({
  init: function(users_manager, user_roles_manager, role_assignments_manager) {
    this._users_manager = users_manager;
    this._user_roles_manager = user_roles_manager;
    this._role_assignments_manager = role_assignments_manager;
  },

  all: function(params, callback) {
    this._role_assignments_manager.all({
      query: {
        "scope.project.id": params.data.project,
        "user.id": params.data.user
      }
    }, _.bind(function(err, assignments) {
      if (err) {
        return base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
      }

      var convertAssignment = _.bind(function(project, assignment, cb) {
        this._fetchUserMembership(project.assignment.user, cb);
      }, this, params.data.project);

      async.map(assignments, convertAssignment, function(err, results) {
        base.Manager.prototype.safe_complete.call(this, err, results, null, params, callback);
      });
    }, this));
  },


  del: function(params, callback) {
    var endpoint_type = params.endpoint_type;
    this._user_roles_manager.all({
      project: params.data.project,
      user: params.id,
      endpoint_type: endpoint_type,
      success: _.bind(function(roles) {
        var calls = _.map(roles, _.bind(function(role) {
          return _.bind(function(done) {
            this._user_roles_manager.del({
              id: role.id,
              project: params.data.project,
              user: params.id,
              endpoint_type:endpoint_type,
              success: function() {
                done(null);
              },
              error: function(err) {
                done(err);
              }
            });
          }, this);
        }, this));

        async.parallel(calls, function(err) {
          if (err) {
            base.Manager.prototype.safe_complete.call(this, err, null, null, params, callback);
            return;
          }
          base.Manager.prototype.safe_complete.call(this, null, null, {status:200}, params, callback);
        })
      }, this),
      error: function(err, xhr) {
        base.Manager.prototype.safe_complete.call(this, err, null, xhr, params, callback);
      }
    });
  },


  create: function(params, callback) {
    var endpoint_type = params.endpoint_type;

    this._user_roles_manager.update({
      id: params.data.id,
      project: params.data.project,
      user: params.data.user,
      endpoint_type: endpoint_type,
      success: _.bind(function() {
        this._fetchUserMembership(params.data.project, {id: params.data.user}, function(err, user) {
          base.Manager.prototype.safe_complete.call(this, null, user, {status: 200}, params, callback);
        })
      }, this),
      error: _.bind(function(err, xhr) {
        base.Manager.prototype.safe_complete.call(this, err, null, xhr, params, callback);
      }, this)
    });
  },


  get: function(params, callback) {
    this._fetchUserMembership(params.data.project, {id: params.data.group}, function(err, membership) {
      if (err) {
        base.Manager.prototype.safe_complete.call(this, err, null, {error:err}, params, callback);
      } else {
        base.Manager.prototype.safe_complete.call(this, null, membership, {status: 200}, params, callback);
      }
    });
  },

  _fetchUserMembership: function(project, userSpec, cb) {
    this._users_manager.get({
      id: userSpec.id
    }, _.bind(function(err, user) {
      if (err) {
        cb(err);
        return;
      }

      this._fetchProjectRolesForUser(project, user, function(err, roles) {
        if (err) {
          cb(err);
          return;
        }

        cb(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles,
          enabled: user.enabled,
          assignableType: "user",
          _backingObj: user
        });
      });

    }, this));
  },


  _fetchProjectRolesForUser: function(project, userSpec, cb) {
    console.log("DBG: Fetching user roles", project, userSpec.id);
    this._user_roles_manager.all({
      project: project,
      user: userSpec.id
    }, cb);
  }
});

module.exports = UserProjectMembershipManager;
