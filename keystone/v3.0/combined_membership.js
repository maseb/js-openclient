/*global require: false, module: false */

var _     = require("underscore"),
    async = require("async"),
    Class = require("../../client/inheritance").Class,
    base  = require("../../client/base"),
    error = require("../../client/error");

var ProjectMembershipManager = Class.extend({
  init: function(users_manager, user_roles_manager, groups_manager, group_roles_manager, role_assignments_manager) {
    this._users_manager            = users_manager;
    this._user_roles_manager       = user_roles_manager;
    this._groups_manager           = groups_manager;
    this._group_roles_manager      = group_roles_manager;
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
      this._createUserMembership(params, callback);
    } else if (assignableType === "group") {
      this._createGroupMembership(params, callback);
    } else {
      base.Manager.prototype.safe_complete.call(this, new Error("Invalid assignableType"), null, null, params, callback);
    }
  },

  del: function(params, callback) {
    console.log("DBG: DEL call", JSON.stringify(params));
    var assignableType = params.data.assignableType;
    if (assignableType === "user") {
      this._delUserMembership(params, callback);
    } else if (assignableType === "group") {
      this._delGroupMembership(params, callback);
    } else {
      cb(new Error("Invalid assignableType"));
    }

  },

  _delUserMembership: function(params, callback) {
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

  _delGroupMembership: function(params, callback) {
    var endpoint_type = params.endpoint_type;
    this._group_roles_manager.all({
      project: params.data.project,
      group: params.id,
      endpoint_type: endpoint_type,
      success: _.bind(function(roles) {
        var calls = _.map(roles, _.bind(function(role) {
          return _.bind(function(done) {
            this._group_roles_manager.del({
              id: role.id,
              project: params.data.project,
              group: params.id,
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

  _createUserMembership: function(params, callback) {
    var endpoint_type = params.endpoint_type;

    this._user_roles_manager.update({
      id: params.data.id,
      project: params.data.project,
      user: params.data.user,
      endpoint_type: endpoint_type,
      success: _.bind(function() {
        this._coerceAsUser(params.data.project, {id: params.data.user}, function(err, user) {
          base.Manager.prototype.safe_complete.call(this, null, user, {status: 200}, params, callback);
        })
      }, this),
      error: _.bind(function(err, xhr) {
        base.Manager.prototype.safe_complete.call(this, err, null, xhr, params, callback);
      }, this)
    });
  },

  _createGroupMembership: function(params, callback) {
    var endpoint_type = params.endpoint_type;

    this._group_roles_manager.update({
      id: params.data.id,
      project: params.data.project,
      group: params.data.group,
      endpoint_type: endpoint_type,
      success: _.bind(function() {
        this._coerceAsGroup(params.data.project, {id: params.data.group}, function(err, user) {
          base.Manager.prototype.safe_complete.call(this, null, user, {status: 200}, params, callback);
        });
      }, this),
      error: _.bind(function(err, xhr) {
        base.Manager.prototype.safe_complete.call(this, err, null, xhr, params, callback);
      }, this)
    });
  },

  _convertAssignment: function(project, assignment, cb) {
    if (assignment.user) {
      this._coerceAsUser(project, assignment.user, cb);
    } else if (assignment.group) {
      this._coerceAsGroup(project, assignment.group, cb);
    } else {
      cb(new Error("Unhandled assignment type"));
    }
  },

  _coerceAsUser: function(project, userSpec, cb) {
    console.log("DBG: Coercing as user - fetching user info");
    this._users_manager.get({
      id: userSpec.id
    }, _.bind(function(err, user) {
      console.log("DBG: Coercing as user - fetch result", err, JSON.stringify(user));
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

  _coerceAsGroup: function(project, groupSpec, cb) {
    this._groups_manager.get({
      data: {
        id: groupSpec.id
      }
    }, _.bind(function(err, group) {
      if (err) {
        cb(err);
        return;
      }
      this._fetchProjectRolesForGroup(project, groupSpec, function(err, roles) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, {
          id: groupSpec.id,
          name: group.name,
          roles: roles,
          assignableType: "group",
          _backingObj: group
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
  },

  _fetchProjectRolesForGroup: function(project, groupSpec, cb) {
    this._group_roles_manager.all({
      project: project,
      group: groupSpec.id
    }, cb);
  }
});


module.exports = ProjectMembershipManager;
