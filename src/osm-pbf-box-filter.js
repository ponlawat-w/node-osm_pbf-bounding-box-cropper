const OsmPbfReader = require('./io/osm-pbf-stream-reader');
const sizeStr = require('./utils/size-string');
const formatDouble = require('./utils/number-format-double');
const print = require('./console/print-return');
const filterNodeFunctionGenerator = require('./filters/node');
const GeoType = require('./io/osm-object-type');

module.exports = input => {
  const filteredNodeIds = new Set([]);
  const filteredWayIds = new Set([]);
  const filteredRelationIds = new Set([]);

  const getSetFromType = type => {
    switch (type) {
      case GeoType.node:
        return filteredNodeIds;
      case GeoType.way:
        return filteredWayIds;
      case GeoType.relation:
        return filteredRelationIds;
    }

    return null;
  };

  const filterNode = filterNodeFunctionGenerator(input.northwest, input.southeast);
  
  const reader = new OsmPbfReader(input.sourcePath);
  reader.withInfos = false;

  let readSize = 0;
  const totalSize = reader.size;

  const displayStatus = () => {
    print(`\rReading ${sizeStr(readSize)}/${sizeStr(totalSize)} (${formatDouble.format(readSize / totalSize * 100)}%)`);
  };

  reader.events.on('chunk', chunk => {
    readSize += chunk.length;
    displayStatus();
  });

  reader.events.on('nodes', nodes => {
    nodes.forEach(node => {
      if (filterNode(node)) {
        filteredNodeIds.add(node.id);
      }
    });
    nodeSorted = false;
  });

  reader.events.on('ways', ways => {
    ways.forEach(way => {
      let shouldBeAdded = false;
      for (let i = 0; i < way.refs.length; i++) {
        if (filteredNodeIds.has(way.refs[i])) {
          shouldBeAdded = true;
          filteredWayIds.add(way.id);
          break;
        }
      }

      if (shouldBeAdded) {
        way.refs.forEach(nodeId => {
          filteredNodeIds.add(nodeId);
        });
      }
    });
  });

  reader.events.on('relations', relations => {
    relations.forEach(relation => {
      let shouldBeAdded = false;
      for (let i = 0; i < relation.members.length; i++) {
        const set = getSetFromType(relation.members[i].type);
        if (set && set.has(relation.members[i].id)) {
          shouldBeAdded = true;
          filteredRelationIds.add(relation.id);
          break;
        }
      }

      if (shouldBeAdded) {
        relation.members.forEach(member => {
          const set = getSetFromType(member.type);
          if (set) {
            set.add(member.id);
          }
        })
      }
    });
  });

  reader.start();

  return new Promise(resolve => {
    reader.events.on('finish', () => {
      print('Primarily Filter OK');
      resolve({
        nodes: filteredNodeIds,
        ways: filteredWayIds,
        relations: filteredRelationIds
      });
    });
  });
};
