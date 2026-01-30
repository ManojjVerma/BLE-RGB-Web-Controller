let device;
let server;
let characteristic;

/* ===== UUIDs ===== */
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHAR_UUID    = '0000ffe1-0000-1000-8000-00805f9b34fb';

/* ===== UI ===== */
function status(msg) {
  document.getElementById('status').innerText = msg;
}

/* ===== BLE ===== */
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

function powerOn() {
  send([0xA0, 0x62, 0x01, 0x01]);
}

function powerOff() {
  send([0xA0, 0x62, 0x01, 0x00]);
}


function send(bytes) {
  if (!characteristic) return;
  characteristic.writeValue(new Uint8Array(bytes));
}

/* ===== CONTROLLER STATE ===== */
let desiredRGB = { r: 255, g: 0, b: 0 };
let controllerMode = 'rgb'; // 'rgb' or 'effect'
let lastSendTime = 0;
let rgbSendScheduled = false;

/* ===== RATE-LIMITED RGB SENDER ===== */
function scheduleRGBSend() {
  if (rgbSendScheduled) return;
  rgbSendScheduled = true;

  setTimeout(() => {
    rgbSendScheduled = false;

    // Step 1: ensure RGB mode
    if (controllerMode !== 'rgb') {
      send([0xA0, 0x63, 0x01, 0xBE]);
      controllerMode = 'rgb';
    }

    // Step 2: small settle delay
    setTimeout(() => {
      send([
        0xA0,
        0x69,
        0x04,
        desiredRGB.r,
        desiredRGB.g,
        desiredRGB.b,
        0xFF
      ]);
    }, 120);

  }, 500); // 🔑 HARD RATE LIMIT
}

/* ===== BRIGHTNESS ===== */
document.getElementById('brightness').addEventListener('input', e => {
  const value = parseInt(e.target.value);
  send([0xA0, 0x66, 0x01, value]);
});

/* ===== EFFECTS ===== */
function setEffect(mode) {
  controllerMode = 'effect';
  send([0xA0, 0x63, 0x01, mode]);
}

/* ===== COLOR PICKER ===== */
const picker = new iro.ColorPicker("#picker", {
  width: 260,
  color: "#ff0000",
  layout: [
    { component: iro.ui.Wheel },
    { component: iro.ui.Slider, options: { sliderType: 'value' } },
    { component: iro.ui.Slider, options: { sliderType: 'red' } },
    { component: iro.ui.Slider, options: { sliderType: 'green' } },
    { component: iro.ui.Slider, options: { sliderType: 'blue' } }
  ]
});

picker.on('color:change', color => {
  if (!characteristic) return;

  // Update desired state ONLY
  desiredRGB = {
    r: color.rgb.r,
    g: color.rgb.g,
    b: color.rgb.b
  };

  // Ask sender to send when allowed
  scheduleRGBSend();
});
