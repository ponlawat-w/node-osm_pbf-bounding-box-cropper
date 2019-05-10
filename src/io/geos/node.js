const type = require('./../osm-object-type').node;

module.exports = (id, lat, lng, data = {}) => ({
  id: id,
  lat: lat,
  lng: lng,
  type: type,
  ...data
});
