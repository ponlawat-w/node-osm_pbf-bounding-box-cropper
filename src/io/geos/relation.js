const type = require('./../osm-object-type').relation;

module.exports = (id, members, data = {}) => ({
  id: id,
  members: members,
  type: type,
  ...data
});
