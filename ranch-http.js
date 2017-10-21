const http = require('http');

const apikey = process.env.RANCH_APIKEY;
const serverHost = process.env.RANCH_SERVER; // 138.68.110.4

if (!apikey || !serverHost) {
    throw new Error('Environment variables missing');
}

const apiParam = `?apikey=${apikey}`;

module.exports.sendValue = (serial, value) => {
	try{
        console.log('Sending value', serial, value);
        const sensorSerial = encodeURIComponent(serial);
        const options = {
            hostname: serverHost,
            port: process.env.RANCH_PORT || 80,
            path: `/api/v1/sensor/${sensorSerial}/measurement${apiParam}`,
            method: 'POST',
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Data sent response:', chunk);
            });
        });

        req.on('error', (e) => {
            console.log(`problem sending sensor data: ${e.message}`);
        });

        // write data to request body
        const postData = JSON.stringify({
            value,
        });

        req.write(postData);
        req.end();
    }
    catch(e) {
        console.log("Something wrong sending new value");
        console.log(e);
    }
}