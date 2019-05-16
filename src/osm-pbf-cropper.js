const OsmPbfReader = require('./io/osm-pbf-stream-reader');
const OsmPbfWriter = require('./io/osm-pbf-stream-writer');
const GeoType = require('./io/osm-object-type');
const nodeFilterFunctionGenerator = require('./filters/node');
const filterWay = require('./filters/way');
const filterRelation = require('./filters/relation');
const process = require('process');
const osmPbfToGeoJson = require('./osm-pbf-to-geojson');

module.exports = input => {
  const reader = new OsmPbfReader(input.sourcePath);
  const writer = new OsmPbfWriter(input.targetPath);
  const nf = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
  const nfNoFrac = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  });
  const sizeStr = size => {
    if (size > 1048576) {
      return `${nf.format(size / 1048576)}MB`;
    }
    if (size > 1024) {
      return `${nf.format(size / 1024)}KB`;
    }
    return `${nf.format(size)} bytes`
  };
  
  let lastPrintedMsgLength = 1;
  const print = msg => {
    const msgLength = msg.length;
    if (msgLength < lastPrintedMsgLength) {
      process.stdout.clearLine();
    }
    process.stdout.write(`\r${msg}`);

    lastPrintedMsgLength = msgLength;
  };

  let sizeRead = 0;
  let sizeWritten = 0;
  
  const printStatus = () => {
    const readPercentage = (sizeRead / reader.size) * 100;
    const totalRead = `${sizeStr(sizeRead)} / ${sizeStr(reader.size)} (${nf.format(readPercentage)}%)`;
    const totalWrite = `${sizeStr(sizeWritten)} (${nfNoFrac.format(writer.geos.length)} in queue)`;
    const str = `In: ${totalRead} => Out: ${totalWrite}`;
    print(str);
  };

  const filterNode = nodeFilterFunctionGenerator(input.northwest, input.southeast);

  const filteredGeos = {};
  filteredGeos[GeoType.node] = [];
  filteredGeos[GeoType.way] = [];
  filteredGeos[GeoType.relation] = [];

  const allRelations = [];

  let nodeSorted = false;
  let waySorted = false;

  const checkNodesAndSort = () => {
    if (!nodeSorted) {
      print('Sorting nodes...');
      filteredGeos[GeoType.node] = filteredGeos[GeoType.node].sort();
      nodeSorted = true;
    }
  };
  const checkWaysAndSort = () => {
    if (!waySorted) {
      print('Sorting ways...');
      filteredGeos[GeoType.way] = filteredGeos[GeoType.way].sort((w1, w2) => w1.id - w2.id);
      waySorted = true;
    }
  };
  const sortRelations = () => {
    print('Sorting relations...');
    filteredGeos[GeoType.relation] = filteredGeos[GeoType.relation].sort((r1, r2) => r1.id - r2.id);
  };

  reader.events.on('nodes', nodes => {
    nodes.filter(node => filterNode(node)).forEach(node => {
      filteredGeos[GeoType.node].push(parseInt(node.id));
      writer.addGeo(node);
    });
    nodeSorted = false;
  });
  reader.events.on('ways', ways => {
    checkNodesAndSort();
    ways.filter(way => filterWay(way, filteredGeos)).forEach(way => {
      filteredGeos[GeoType.way].push(parseInt(way.id));
      writer.addGeo(way);
    });
    waySorted = false;
  });
  reader.events.on('relations', relations => {
    checkNodesAndSort();
    checkWaysAndSort();
    relations.forEach(relation => {
      allRelations.push(relation);
      filteredGeos[GeoType.relation].push(parseInt(relation.id));
    });
  });

  reader.events.on('finish', () => {
    sortRelations();
    allRelations.forEach(relation => {
      if (filterRelation(relation, filteredGeos)) {
        writer.addGeo(relation);
      }
    });
    
    writer.finish();
  });
  writer.events.on('finish', () => {
    console.log('\nFinished!');

    console.log('Writing target in json format...');
    osmPbfToGeoJson(input.targetPath, input.targetGeoJson).then(() => {
      console.log('Finished!');
    });
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
