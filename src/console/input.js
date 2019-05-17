const argumentsParser = require('./../utils/args-parser');

module.exports = () => {
  const args = argumentsParser(['-s', '--source', '-t', '--target', '-nw', '--northwest', '-se', '--southeast', '-g', '--geojson']);

  const northwest = args.getOrReadline(
    ['-nw', '--northwest'],
    'Northwest Point [lat,lng]: '
  ).split(',').map(s => parseFloat(s.trim()));

  const southeast = args.getOrReadline(
    ['-se', '--southeast'],
    'Southeast Point [lat,lng]: '
  ).split(',').map(s => parseFloat(s.trim()));
  
  return {
    sourcePath: args.getOrReadline(['-s', '--source'], 'Source Path: '),
    targetPath: args.getOrReadline(['-t', '--target'], 'Target Path: '),
    // targetGeoJson: args.getOrReadline(['-g', '--geojson'], 'Target GeoJson: '),
    northwest: {
      lat: northwest[0],
      lng: northwest[1]
    },
    southeast: {
      lat: southeast[0],
      lng: southeast[1]
    }
  };
};
