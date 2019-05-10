module.exports =
  (nw, se) =>
    node => ((node.lat >= se.lat && node.lat <= nw.lat)
      && (node.lng >= nw.lng && node.lng <= se.lng));
