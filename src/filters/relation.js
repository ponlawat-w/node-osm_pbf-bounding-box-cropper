const GeoType = require('./../io/osm-object-type');
const binarySearch = require('./../utils/binary-search');

module.exports = (relation, filteredGeos) => {
  for (let m = 0; m < relation.members.length; m++) {
    if (!binarySearch(filteredGeos[relation.members[m].type], relation.members[m].id)) {
      return false;
    }
  }

  return true;
};
