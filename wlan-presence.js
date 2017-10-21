const spawn = require('child_process').spawn;
const config = require('./presence-config');

let lastUpdate;

const scan = () => new Promise(resolve => {
  let out;
  let err;
  const arp = spawn('arp-scan', ['-l']);

  arp.stdout.on('data', part => out += part);
  arp.stderr.on('data', part => err += part);

  arp.on('exit', status => {
    if(status === 0) {
      return resolve(out.split('\n')
        .slice(2, -4)
        .map(line => line.split('\t')[1]));
    }
    throw new Error(err);
  });

  arp.on('error', err => { throw new Error(err); });
})

module.exports = sendValue => {
  const checkPresence = () => scan()
    .then(foundMACs => {
      const isPresent = config.macs.reduce((memo, mac) => memo || foundMACs.indexOf(mac) !== -1, false);
      const numValue = isPresent ? 1: 0;
      if (lastUpdate !== numValue) {
        sendValue(config.sensorName, numValue);
        lastUpdate = numValue;
      }
    })
    .catch(err => console.log('err', err));
  setInterval(checkPresence, config.checkInterval);
}
