/*global require: false, module: false */

var _     = require("underscore"),
    Class = require("../../../client/inheritance").Class;

var VALID_ASSIGNABLE_TYPES = ["user", "group"];

var AssignablesHelper = Class.extend({
  init: function() {
    _.bindAll(this, "parseDisambiguatedId", "disambiguatedId");
  },
  parseDisambiguatedId: function(disambiguated_id) {
    var data = {},
      parts = disambiguated_id.split("_"),
    // Snag the proposed assignable_type off the front
      assignable_type = parts.shift(),
    // Put the rest back together again
      id = parts.join("_");

    if (!_.contains(VALID_ASSIGNABLE_TYPES, assignable_type)) {
      return null;
    }

    data.assignable_type = assignable_type;
    data.id = id;

    return data;
  },

  disambiguatedId: function(assignable_type, id) {
    if (!_.contains(VALID_ASSIGNABLE_TYPES, assignable_type)) {
      throw new Error("Invalid assignable_type `"+assignable_type+"` specified; must be one of " + VALID_ASSIGNABLE_TYPES.join(", "));
    }
    return assignable_type + "_" + id;
  }
});

module.exports = AssignablesHelper;
