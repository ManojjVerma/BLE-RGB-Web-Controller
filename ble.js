let device;
let server;

async function scanAndConnect() {
  document.getElementById("status").innerText = "Scanning...";

  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [] // add service UUIDs if needed
    });

    document.getElementById("status").innerText =
      "Connecting to " + (device.name || "Unknown device");

    server = await device.gatt.connect();

    document.getElementById("status").innerText =
      "Connected to " + (device.name || "Device");

    device.addEventListener('gattserverdisconnected', onDisconnected);

  } catch (error) {
    document.getElementById("status").innerText =
      "Error: " + error.message;
  }
}

function onDisconnected() {
  document.getElementById("status").innerText = "Device disconnected";
}
