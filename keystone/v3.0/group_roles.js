var base = require("../../client/base"),
  error = require("../../client/error"),
  interpolate = require("../../client/utils").interpolate;


var UserRoleManager = base.Manager.extend({
  namespace: "/projects/{project_id}/groups/{group_id}/roles",
  plural: "roles",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, { project_id: params.project, group_id: params.group });
  },

  get: function (params) { throw new error.NotImplemented(); },
  create: function (params) { throw new error.NotImplemented(); }
});


module.exports = UserRoleManager;
