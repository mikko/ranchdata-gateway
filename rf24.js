const SerialPort = require("serialport");

function connectUSB(devicePath) {
    const port = new SerialPort(devicePath, { 
        baudRate: 9600
    });
    port.on("open", () => {
        console.log("Serial port open");
    });

    return port.pipe(new SerialPort.parsers.Readline({ delimiter: '}' }));
}

module.exports = (usbDevice, sendValue) => {
    if (!sendValue) {
        throw new Error('Callback missing');
    }

    const port = connectUSB(usbDevice);

    port.on("data", data => {
        let newData = data.toString("ascii") + "}";
        console.log("New data | ", newData, "|");
        try{
            let parsedMessage = JSON.parse(newData);
            console.log("Sensordata", JSON.stringify(parsedMessage, null, 2));
            sendValue(parsedMessage.address, parsedMessage.value);
        }
        catch(e) {
            console.log("Something wrong parsing message");
            console.log(e);
        }
    });
}
