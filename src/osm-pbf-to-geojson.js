const fs = require('fs');
const process = require('process');
const OsmPbfReader = require('./io/osm-pbf-stream-reader');

const GeoType = require('./io/osm-object-type');

const nodesDictById = {};
const waysDictById = {};
const relationsDictById = {};

const nodeToFeature = node => ({
  type: 'Feature',
  properties: {
    'marker-color': '#7e7e7e',
    'marker-size': 'small',
    'marker-symbol': '',
    'id': node.id,
    ...node.tags
  },
  geometry: {
    type: 'Point',
    coordinates: [
      node.lng,
      node.lat
    ]
  }
});

const wayToFeature = way => ({
  type: 'Feature',
  properties: {
    stroke: '#555555',
    'stroke-width': 1,
    'stroke-opacity': 1,
    ...(way.tags ? way.tags : {})
  },
  geometry: {
    type: 'LineString',
    coordinates: way.refs.map(ref => {
      if (!nodesDictById[ref]) {
        return null;
      }
      return [
        nodesDictById[ref].lng,
        nodesDictById[ref].lat
      ];
    }).filter(n => n)
  }
});

const relationToFeatureCollection = relation => ({
  type: 'FeatureCollection',
  properties: relation.tags,
  features: relation.members.map(member => {
    if (member.type === GeoType.node && nodesDictById[member.id]) {
      return nodeToFeature(nodesDictById[member.id]);
    } else if (member.type === GeoType.way && waysDictById[member.id]) {
      const feature = wayToFeature(waysDictById[member.id]); 
      if (feature.geometry.coordinates.length > 1) {
        return feature;
      }
    } else if (member.type === GeoType.relation && relationsDictById[member.id]) {
      return relationToFeatureCollection(relationsDictById[member.id]);
    }
    return null;
  }).filter(m => m)
});

const writeFeatures = (features, filePath) => {
  fs.writeFileSync(filePath, JSON.stringify({
    type: 'FeatureCollection',
    features: features
  }));
};

module.exports = (osmPbfPath, geoJsonPath) => {
  console.log('Converting .osm.obf to .json ...');
  const reader = new OsmPbfReader(osmPbfPath);

  const nodeFeatures = [];
  const waysFeatures = [];

  let nodeWritten = false;
  let waysWritten = false;

  reader.events.on('nodes', nodes => {
    nodes.forEach(node => {
      nodeFeatures.push(nodeToFeature(node));
      nodesDictById[node.id] = node;
    });
  });

  reader.events.on('ways', ways => {
    if (!nodeWritten) {
      process.stdout.write('Writing nodes...');
      writeFeatures(nodeFeatures, `${geoJsonPath}/nodes.json`);
      console.log('OK');
      nodeWritten = true;
    }

    ways.forEach(way => {
      waysFeatures.push(wayToFeature(way));
      waysDictById[way.id] = way;
    });
  });

  reader.events.on('relations', relations => {
    if (!waysWritten) {
      process.stdout.write('Writing ways...');
      writeFeatures(waysFeatures.filter(f => f.geometry.coordinates.length > 1),
        `${geoJsonPath}/ways.json`);
      console.log('OK');
    }

    relations.forEach(relation => {
      process.stdout.write(`Writing relation #${relation.id}...`);
      const relationFeatureCollection = relationToFeatureCollection(relation);
      fs.writeFileSync(`${geoJsonPath}/relation_${relation.id}.json`, JSON.stringify(relationFeatureCollection));
      console.log('OK');

      relationsDictById[relation.id] = relation;
    });
  });

  reader.start();

  return new Promise(resolve => {
    reader.events.on('finish', () => {
      resolve();
    });
  });
};
