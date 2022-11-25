const Obniz = require("obniz");
const obniz = new Obniz("3199-XXXX");
const MESH_100MD = Obniz.getPartsClass("MESH_100MD");
obniz.onconnect = async function () {
  // obniz人感センサー
  const senseor = obniz.wired("Keyestudio_PIR", { signal: 0, vcc: 1, gnd: 2 });
  senseor.onchange = function (val) {
    console.log(val ? '通過' : 'いない');
  }

  // MESH人感センサー
  await obniz.ble.initWait();
  await obniz.ble.scan.startWait();
  obniz.ble.scan.onfind = async (peripheral) => {
    if (!MESH_100MD.isMESHblock(peripheral)) {
      return;
    }

    // Create an instance
    const motionBlock = new MESH_100MD(peripheral);

    // Connect to the Motion block
    await motionBlock.connectWait();
    console.log(`connected: ${motionBlock.peripheral.localName}`);

    motionBlock.onSensorEvent = ((motionState, notifyMode) => {
      switch (motionState) {
        case MESH_100MD.MotionState.DETECTED: {
          console.log('Detected !');
          break;
        }
        case MESH_100MD.MotionState.NOT_DETECTED: {
          console.log('Not Detected.');
          break;
        }
        default: {
          console.log('Starting up...');
          break;
        }
      }
    });

    // Prepare params
    const notifyMode = MESH_100MD.NotifyMode.ALWAYS;

    // Write
    motionBlock.setMode(notifyMode);
  };
}