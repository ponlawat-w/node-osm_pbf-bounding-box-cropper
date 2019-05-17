const formatDouble = require('./number-format-double');
const formatInt = require('./number-format-int');

module.exports = size => {
  if (size > 1048576) {
    return `${formatDouble.format(size / 1048576)}MB`;
  }
  if (size > 1024) {
    return `${formatDouble.format(size / 1024)}KB`;
  }
  return `${formatDouble.format(size)} bytes`
};
