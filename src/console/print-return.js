let lastPrintedMsgLength = 1;
module.exports = msg => {
  const msgLength = msg.length;
  if (msgLength < lastPrintedMsgLength) {
    process.stdout.clearLine();
  }
  process.stdout.write(`\r${msg}`);

  lastPrintedMsgLength = msgLength;
};
