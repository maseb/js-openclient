/*global require: false, module: false */

var v2_client                     = require("../v2.0/client"),
    GroupsManager                 = require("./groups"),
    GroupRolesManager             = require("./group_roles"),
    ProjectGroupMembershipManager = require("./project_group_membership");


var Keystone = v2_client.extend({
  service_type: "identity",
  version: "3.0",

  init: function (options) {
    this._super(options);
    this.groups = new GroupsManager(this);
    this.group_roles = new GroupRolesManager(this);
    this.project_group_membership = new ProjectGroupMembershipManager(this);
  }
});

module.exports = Keystone;
