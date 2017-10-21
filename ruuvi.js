// Remove the need for root
// sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

const ruuvi = require('node-ruuvitag');

module.exports = sendValue => {
  if (!sendValue) {
    throw new Error('Callback missing');
  }

  let prevRuuviUpdate = {};

  const ruuviInterval = 20 * 60 * 1000;
  const selectedMeasurements = [
    'humidity',
    'temperature',
    'pressure',
    'battery'
  ];

  ruuvi.on('found', tag => {
    console.log('Found RuuviTag, id: ' + tag.id);
    const tagId = tag.id;
    prevRuuviUpdate[tagId] = 0;
    tag.on('updated', data => {
      const now = new Date().getTime();
      if (now - prevRuuviUpdate[tagId] > ruuviInterval) {
          prevRuuviUpdate[tagId] = now;
          // TODO: map ruuvi ID to proper name
          selectedMeasurements.forEach(measurement => 
            sendValue(`ruuvi/${measurement}`, data[measurement]));
      }
    });
  });
}
