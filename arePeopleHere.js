

const client = new KintoneRestAPIClient({
  baseUrl: Config.kintone.baseUrl,
  auth: {
    apiToken: Config.kintone.apiToken,
  },
});

const sendToKintone = async (num, roomName) => {
  await client.record.addRecord({
    app: Config.kintone.appId,
    record: {
      在室人数: { value: num },
      会議室名: { value: roomName },
    },
  });
};

const obniz = new Obniz(Config.obnizId);
const MESH_100MD = Obniz.getPartsClass(Config.meshId);

obniz.onconnect = async function () {
  // obniz人感センサー
  const senseor = obniz.wired("Keyestudio_PIR", { signal: 0, vcc: 1, gnd: 2 });
  senseor.onchange = function (val) {
    if (val) {
      console.log("1名入りました");
      sendToKintone(1, "会議室X");
    } else {
      console.log("入口通過なし");
    }
  }

  // MESH人感センサー
  await obniz.ble.initWait();
  await obniz.ble.scan.startWait();
  obniz.ble.scan.onfind = async (peripheral) => {
    if (!MESH_100MD.isMESHblock(peripheral)) {
      return;
    }

    const motionBlock = new MESH_100MD(peripheral);

    await motionBlock.connectWait();
    console.log(`connected: ${motionBlock.peripheral.localName}`);

    while (peripheral.connected) {
      const motionState = await motionBlock.getSensorDataWait();
      switch (motionState) {
        case MESH_100MD.MotionState.DETECTED: {
          console.log('1名出ました');
          sendToKintone(1, "会議室Y");
          break;
        }
        case MESH_100MD.MotionState.NOT_DETECTED: {
          console.log('出口通過なし');
          break;
        }
        default: {
          console.log('データ取得中');
          break;
        }
      }
      await wait(1 * 1000);
    }

    // motionBlock.onSensorEvent = (async (motionState) => {
    //   switch (motionState) {
    //     case MESH_100MD.MotionState.DETECTED: {
    //       console.log('1名出ました');
    //       sendToKintone(1, "会議室Y");
    //       break;
    //     }
    //     case MESH_100MD.MotionState.NOT_DETECTED: {
    //       console.log('通過なし');
    //       break;
    //     }
    //     default: {
    //       console.log('データ取得中');
    //       break;
    //     }
    //   }
    // });

    const notifyMode = MESH_100MD.NotifyMode.ALWAYS;

    motionBlock.setMode(notifyMode);
  };
}
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};