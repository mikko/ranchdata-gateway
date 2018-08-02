const telldus = require('telldus');
const config = require('./telldus-config');
const devices = config.devices;

let cmdUpdates = {};
let sensorUpdates = {};

const parseEvent = (eventString) => eventString
  .split(';')
  .reduce((memo, datum) => {
    const [key, value] = datum.split(':');
    if (value !== undefined) {
      memo[key] = value;
    }
    return memo;
    }, {});

const getDeviceIdentifier = (event) => event.class === 'command' ?
  `${event.protocol}:${event.model}:${event.house}:${event.unit}` : 
  `${event.protocol}:${event.model}:${event.id}`;

const getSensorName = (event) => devices[getDeviceIdentifier(event)];

const handleCommand = (event, sendValue) => {
  console.log('Handling command');
  const unitIdentifier = getDeviceIdentifier(event);

  const sensorName = getSensorName(event);

  const cacheId = `${sensorName}:${event.method}`;
  const lastSent = cmdUpdates[cacheId];
  const now = new Date().getTime();

  const shouldSendNow = lastSent === undefined || now - lastSent > config.commandDebounce;
  if (sensorName === undefined || !shouldSendNow) {
    if (!shouldSendNow) {
      console.log('Debounced command send. Sent', (now - lastSent)/1000, 'seconds ago');
    }
    return;
  }

  if (event.method === 'turnon') {
    sendValue(sensorName, 1);
    cmdUpdates[`${sensorName}:${event.method}`] = now;
  } else if (event.method === 'turnoff') {
    sendValue(sensorName, 0);
    cmdUpdates[`${sensorName}:${event.method}`] = now;
  }
}

const handleSensor = (event, sendValue) => {
  const sendDebounced = (sensorName, value) => {
    const lastSent = sensorUpdates[sensorName];
    const now = new Date().getTime();
    const shouldSendNow = lastSent === undefined || now - lastSent > config.sendInterval;
    if (shouldSendNow) {
      sensorUpdates[sensorName] = now;
      sendValue(sensorName, value);
    } else {
      console.log('Ignored sensor update', sensorName, value, (now - lastSent)/1000, 'seconds from last update');
    }
  }

  const sensorType = event.model;
  const sensorIdentifier = getDeviceIdentifier(event);
  if (sensorType === 'temperature') {
    const measurementIdentifier = `${sensorIdentifier}:temp`;
    sendDebounced(devices[measurementIdentifier], event.temp);
//      console.log(devices[measurementIdentifier], event.temp);
  } else if (sensorType === 'temperaturehumidity') {
    const tempIdentifier = `${sensorIdentifier}:temp`;
    // console.log(devices[tempIdentifier], event.temp);
    sendDebounced(devices[tempIdentifier], event.temp);
    const humidityIdentifier = `${sensorIdentifier}:humidity`;
    // console.log(devices[humidityIdentifier], event.humidity);
    sendDebounced(devices[humidityIdentifier], event.humidity);
  } else {
    console.log('Unknown sensor type', sensorType);
  }
}

module.exports = sendValue => {
  if (!sendValue) {
    throw new Error('Callback missing');
  }

  const rawListener = telldus.addRawDeviceEventListener(function(controllerId, data) {
    const event = parseEvent(data);
    const eventType = event.class;
    if (eventType === 'command') {
      handleCommand(event, sendValue);
    } else if (eventType === 'sensor') {
      handleSensor(event, sendValue);
    }
  });
}
