/*global require: false, module: false */

var v2_client                     = require("../v2.0/client"),
    CompositeManager              = require("./composite_manager"),
    GroupsManager                 = require("./groups"),
    GroupRolesManager             = require("./group_roles"),
    ProjectGroupMembershipManager = require("./project_group_membership"),
    UserManager                   = require("../v2.0/users");


var Keystone = v2_client.extend({
  service_type: "identity",
  version: "3.0",

  init: function (options) {
    this._super(options);

//
    this.groups = new GroupsManager(this);
//    var groupManager = new GroupsManager(this);
//    var userManager = new UserManager(this);
//    this.groups = new CompositeManager([
//      {
//        manager: groupManager,
//        map: function(group) {
//          console.log("GROUP", group);
//          return {
//            __type: "group",
//            id: group.id,
//            name: group.name,
//            _backingObject: group
//          };
//        }
//      },
//      {
//        manager: userManager,
//        map: function(user) {
//          console.log("USER", user);
//          return {
//            __type: "user",
//            id: user.id,
//            name: user.name,
//            _backingObject: user
//          };
//        }
//      }
//    ]);

    this.group_roles = new GroupRolesManager(this);
    this.project_group_membership = new ProjectGroupMembershipManager(this);


  }
});

module.exports = Keystone;
