const rf24 = require('./rf24');
const ruuvi = require('./ruuvi');
const ranch = require('./ranch-http');
const presence = require('./wlan-presence');

rf24('/dev/ttyUSB0', ranch.sendValue);
ruuvi(ranch.sendValue);
presence(ranch.sendValue);
