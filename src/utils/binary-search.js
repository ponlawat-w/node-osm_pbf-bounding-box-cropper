module.exports = (sortedArr, search) => {
  let firstIndex = 0;
  let lastIndex = sortedArr.length;

  while (firstIndex + 1 < lastIndex) {
    const testIndex = Math.floor((firstIndex + lastIndex) / 2);
    if (sortedArr[testIndex] > search) {
      lastIndex = testIndex;
    } else {
      firstIndex = testIndex;
    }
  }

  return sortedArr[firstIndex] === search;
};
