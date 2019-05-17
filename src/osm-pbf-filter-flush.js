const OsmPbfReader = require('./io/osm-pbf-stream-reader');
const OsmPbfWriter = require('./io/osm-pbf-stream-writer');
// const osmPbfToGeoJson = require('./osm-pbf-to-geojson');
const formatDouble = require('./utils/number-format-double');
const formatInt = require('./utils/number-format-int');
const sizeStr = require('./utils/size-string');
const print = require('./console/print-return');

module.exports = (input, filteredGeoSets) => {
  const reader = new OsmPbfReader(input.sourcePath);
  const writer = new OsmPbfWriter(input.targetPath);

  let sizeRead = 0;
  let sizeWritten = 0;
  
  const printStatus = () => {
    const readPercentage = (sizeRead / reader.size) * 100;
    const totalRead = `${sizeStr(sizeRead)} / ${sizeStr(reader.size)} (${formatDouble.format(readPercentage)}%)`;
    const totalWrite = `${sizeStr(sizeWritten)} (${formatInt.format(writer.geos.length)} in queue)`;
    const str = `In: ${totalRead} => Out: ${totalWrite}`;
    print(str);
  };

  reader.events.on('nodes', nodes => {
    nodes.forEach(node => {
      if (filteredGeoSets.nodes.has(node.id)) {
        writer.addGeo(node);
      }
    });
  });
  reader.events.on('ways', ways => {
    ways.forEach(way => {
      if (filteredGeoSets.ways.has(way.id)) {
        writer.addGeo(way);
      }
    });
  });
  reader.events.on('relations', relations => {
    relations.forEach(relation => {
      if (filteredGeoSets.relations.has(relation.id)) {
        writer.addGeo(relation);
      }
    });
  });

  reader.events.on('finish', () => {
    writer.finish();
  });

  writer.events.on('finish', () => {
    print('Finished!');
    // console.log('\nFinished!');

    // console.log('Writing target in json format...');
    // osmPbfToGeoJson(input.targetPath, input.targetGeoJson).then(() => {
    //   console.log('Finished!');
    // });
  });

  reader.events.on('chunk', chunk => {
    sizeRead += chunk.length;
    printStatus();
  });
  writer.events.on('flush', size => {
    sizeWritten += size;
    printStatus();
  });

  reader.start();
};
