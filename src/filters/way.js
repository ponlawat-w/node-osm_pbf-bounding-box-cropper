const GeoType = require('./../io/osm-object-type');
const binarySearch = require('./../utils/binary-search');

module.exports = (way, filteredGeos) => {
  for (let r = 0; r < way.refs.length; r++) {
    if (!binarySearch(filteredGeos[GeoType.node], way.refs[r])) {
      return false;
    }
  }

  return true;
};
