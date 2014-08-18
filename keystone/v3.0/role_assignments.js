var _     = require("underscore"),
    Class = require("../../client/inheritance").Class,
    async = require("async"),
    base  = require("../../client/base"),
    error = require("../../client/error");

var RoleAssignments = base.Manager.extend({
  namespace: "role_assignments",
  plural: "role_assignments"
});

module.exports = RoleAssignments;
