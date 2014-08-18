/*global require: false, module: false */

var v2_client                      = require("../v2.0/client"),
    UserRolesManager               = require("./user_roles"),
    GroupsManager                  = require("./groups"),
    GroupRolesManager              = require("./group_roles"),
    ProjectGroupMembershipManager  = require("./project_group_membership"),
    CombinedMembershipManager      = require("./combined_membership"),
    RoleAssignmentsManager         = require("./role_assignments");

var Keystone = v2_client.extend({
  service_type: "identity",
  version: "3.0",

  init: function (options) {
    this._super(options);
    this.user_roles = new UserRolesManager(this);
    this.groups = new GroupsManager(this);
    this.role_assignments = new RoleAssignmentsManager(this);

    this.group_roles = new GroupRolesManager(this);
    this.project_group_membership = new ProjectGroupMembershipManager(this);
    this.combined_membership = new CombinedMembershipManager(this.users, this.user_roles, this.groups, this.group_roles, this.role_assignments);


  }
});

module.exports = Keystone;
