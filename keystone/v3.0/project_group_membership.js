var async       = require('async'),
    base        = require("../../client/base"),
    error       = require("../../client/error"),
    interpolate = require("../../client/utils").interpolate;

var ProjectGroupMembershipManager = base.Manager.extend({
  namespace: "/projects/{project_id}/groups",
  plural: "groups",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, {project_id: params.data.project});
  },

  get: function (params) { throw new error.NotImplemented(); },

  //all: function (params, callback) {
  //  var manager = this,
  //      success = params.success,
  //      error = params.error;

  //  if (params.success) delete params.success;
  //  if (params.error) delete params.error;

  //  this._super(params, function (err, users) {
  //    if (err) return manager.safe_complete(err, null, null, {error: error}, callback);

  //    // Add in the roles for each user.
  //    async.forEach(users, function (user, next) {
  //      // NOTE: params.url exists here because we passed params into
  //      // the _super call above.
  //      var url = manager.urljoin(params.url, user.id, "roles");
  //      manager.client.get({
  //        url: url,
  //        result_key: "roles",
  //        error: function (err) {
  //          manager.client.log('error', 'Unable to retrieve roles for user "' + user.name + '"');
  //          user.roles = null;
  //          next();
  //        },
  //        success: function (roles) {
  //          user.roles = roles;
  //          next();
  //        }
  //      });
  //    }, function (err) {
  //      if (err) return manager.safe_complete(err, null, null, {error: error}, callback);
  //      manager.safe_complete(err, users, {status: 200}, {success: success}, callback);
  //    });
  //  });
  //},

  // Pseudo-method that adds a group to a project with the given role and
  // returns the group data.
  create: function (params, callback) {
    var manager = this,
      client = this.client,
      endpoint_type = params.endpoint_type;

    client.group_roles.update({
      id: params.data.id,
      project: params.data.project,
      group: params.data.group,
      endpoint_type: endpoint_type,
      success: function (result, xhr) {
        client.groups.get({
          id: params.data.group,
          endpoint_type: endpoint_type,
          success: function (group, xhr) {
            var url = manager.urljoin(manager.get_base_url(params), group.id, "roles");
            manager.client.get({
              url: url,
              result_key: "roles",
              error: function (err, xhr) {
                manager.safe_complete(err, null, xhr, params, callback);
              },
              success: function (roles, xhr) {
                group.roles = roles;
                manager.safe_complete(null, group, {status: 200}, params, callback);
              }
            });
          },
          error: function (err, xhr) {
            manager.safe_complete(err, null, xhr, params, callback);
          }
        });
      },
      error: function (err, xhr) {
        manager.safe_complete(err, null, xhr, params, callback);
      }
    });
  }
});


module.exports = ProjectGroupMembershipManager;
