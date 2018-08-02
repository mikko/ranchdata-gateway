const telldus = require('telldus');
const config = require('./telldus-config');

let cmdUpdates = {};
let sensorUpdates = {};

module.exports = sendValue => {
  if (!sendValue) {
    throw new Error('Callback missing');
  }

  let prevUpdate = {};

  const rawListener = telldus.addRawDeviceEventListener(function(controllerId, data) {
  //  console.log('Raw device event: ', controllerId, data);
    event = data.split(';').reduce((memo, datum) => {
      const [key, value] = datum.split(':');
      if (value !== undefined) {
        memo[key] = value;
      }
      return memo;
    }, {});

    const eventType = event.class;
    const protocolIdentifier = `${event.protocol}:${event.model}`;

  if (eventType === 'command') {
      const unitIdentifier = `${event.house}:${event.unit}`

      const sensorName = filters[`${protocolIdentifier}:${unitIdentifier}`];
      const lastSent = cmdUpdates[`${protocolIdentifier}:${unitIdentifier}:event.method`]
      const now = new Date().getTime();

      const shouldSendNow = lastSent === undefined || now - lastSent > 1000;
      if (sensorName === undefined || !shouldSendNow) {
        return;
      }

      if (event.method === 'turnon') {
  //      console.log(sensorName, 'auki');
        sendValue(sensorName, 1);
        cmdUpdates[`${protocolIdentifier}:${unitIdentifier}:event.method`] = now;
      } else if (event.method === 'turnoff') {
  //      console.log(sensorName, 'kiinni');
        sendValue(sensorName, 0);
        cmdUpdates[`${protocolIdentifier}:${unitIdentifier}:event.method`] = now;
        //console.log(protocolIdentifier, unitIdentifier, event.method);
      }
    } else if (eventType === 'sensor') {
      const sensorType = event.model;
      const sensorIdentifier = `${protocolIdentifier}:${event.id}`;
      if (sensorType === 'temperature') {
        const measurementIdentifier = `${sensorIdentifier}:temp`;
        sendValue(filters[measurementIdentifier], event.temp);
  //      console.log(filters[measurementIdentifier], event.temp);
      } else if (sensorType === 'temperaturehumidity') {
        const tempIdentifier = `${sensorIdentifier}:temp`;
        // console.log(filters[tempIdentifier], event.temp);
        sendValue(filters[tempIdentifier], event.temp);
        const humidityIdentifier = `${sensorIdentifier}:humidity`;
        // console.log(filters[humidityIdentifier], event.humidity);
        sendValue(filters[humidityIdentifier], event.humidity);
      } else {
        console.log('Unknown sensor type', sensorType);
      }
    }
  });


  prevUpdate[tagId] = 0;
  const now = new Date().getTime();
  if (now - prevUpdate[tagId] > ruuviInterval) {
      prevUpdate[tagId] = now;
      // TODO: map ruuvi ID to proper name
      selectedMeasurements.forEach(measurement => 
        sendValue(`ruuvi/${measurement}`, data[measurement]));
  }
  
}

/*
Raw device event:  1 class:command;protocol:everflourish;model:selflearning;house:863;unit:4;method:turnon;
{ class: 'command',
  protocol: 'everflourish',
  model: 'selflearning',
  house: '863',
  unit: '4',
  method: 'turnon' }

Raw device event:  1 class:sensor;protocol:fineoffset;id:135;model:temperaturehumidity;humidity:65;temp:26.1;
{ class: 'sensor',
  protocol: 'fineoffset',
  id: '135',
  model: 'temperaturehumidity',
  humidity: '65',
  temp: '26.1' }

Raw device event:  1 class:sensor;protocol:fineoffset;id:136;model:temperature;temp:30.0;
{ class: 'sensor',
  protocol: 'fineoffset',
  id: '136',
  model: 'temperature',
  temp: '30.0' }

Raw device event:  1 class:sensor;protocol:fineoffset;id:151;model:temperaturehumidity;humidity:77;temp:24.6;
New humidity reading 151 77
New temperature reading 151 24.6




Raw device event:  1 class:command;protocol:arctech;model:selflearning;house:43745278;unit:16;group:0;method:turnon;
Status change
etuovi auki



Raw device event:  1 class:command;protocol:everflourish;model:selflearning;house:14335;unit:4;method:turnon;
Status change
undefined 'auki'



Raw device event:  1 class:command;protocol:arctech;model:selflearning;house:43745278;unit:16;group:0;method:turnoff;
Status change
etuovi auki



*/