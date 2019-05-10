const type = require('./../osm-object-type').way;

module.exports = (id, refs, data = {}) => ({
  id: id,
  refs: refs,
  type: type,
  ...data
});
