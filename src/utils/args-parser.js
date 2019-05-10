const process = require('process');
const readline = require('readline-sync');

module.exports = (acceptedArgs) => {
  const result = {
    get: function(paramNames) {
      for (let i = 0; i < paramNames.length; i++) {
        if (this[paramNames[i]]) {
          return this[paramNames[i]];
        }
      }
      return undefined;
    },
    getOrReadline: function(paramNames, readlineQuestion) {
      const value = this.get(paramNames);
      if (!value) {
        return readline.question(readlineQuestion);
      }
      return value;
    }
  };
  
  process.argv.forEach((value, index) => {
    if (acceptedArgs.indexOf(value) > -1 && index <= process.argv.length - 1) {
      result[value] = process.argv[index + 1];
    }
  });

  return result;
};
