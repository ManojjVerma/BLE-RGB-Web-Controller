let device;
let server;
let characteristic;

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHAR_UUID    = '0000ffe1-0000-1000-8000-00805f9b34fb';

function status(msg) {
  document.getElementById('status').innerText = msg;
}

/* ---------- BLE ---------- */

async function connect() {
  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    device.addEventListener('gattserverdisconnected', () => {
      status('Disconnected');
    });

    server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHAR_UUID);

    status('Connected');
  } catch (e) {
    console.error(e);
    status('Connection failed');
  }
}

function disconnect() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
}

function send(bytes) {
  if (!characteristic) return;
  characteristic.writeValue(new Uint8Array(bytes));
}

/* ---------- RGB COLOR ---------- */

document.getElementById('colorPicker').addEventListener('input', e => {
  const hex = e.target.value;
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);

  // 1️⃣ Switch to RGB mode
  send([0xA0, 0x63, 0x01, 0xBE]);

  // 2️⃣ Small delay before sending RGB
  setTimeout(() => {
    send([0xA0, 0x69, 0x04, r, g, b, 0xFF]);
  }, 60); // 60ms is safe
});


/* ---------- BRIGHTNESS ---------- */

document.getElementById('brightness').addEventListener('input', e => {
  const v = parseInt(e.target.value);
  send([0xA0, 0x66, 0x01, v]);
});

/* ---------- BREATHING EFFECTS ---------- */

function setEffect(mode) {
  send([0xA0, 0x63, 0x01, mode]);
}
