var base = require("../../client/base"),
  error = require("../../client/error"),
  interpolate = require("../../client/utils").interpolate;


var UserRoleManager = base.Manager.extend({
  namespace: "/projects/{project_id}/users/{user_id}/roles",
  plural: "roles",

  prepare_namespace: function (params) {
    return interpolate(this.namespace, {project_id: params.project, user_id: params.user});
  },

  get: function (params) { throw new error.NotImplemented(); },
  create: function (params) { throw new error.NotImplemented(); },
//
//  all: function (params, callback) {
//    // Keystone's role listing URL doesn't have the extension affix in the URL.
//    params.url = this.get_base_url(params).replace("/OS-KSADM", "");
//    return this._super(params, callback);
//  }
});


module.exports = UserRoleManager;
