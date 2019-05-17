const readInput = require('./src/console/input');

const filterBox = require('./src/osm-pbf-box-filter');
const flushFilter = require('./src/osm-pbf-filter-flush');
// const osmPbfToGeoJson = require('./src/osm-pbf-to-geojson');

const input = readInput();
filterBox(input).then(filteredObjects => {
  flushFilter(input, filteredObjects);
});
