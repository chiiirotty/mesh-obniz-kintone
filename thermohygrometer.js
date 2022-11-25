const Obniz = require("obniz");
const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

const Config = {
  kintone: {
    apiToken: "APIトークンを入力",
    baseUrl: "https://サブドメイン.cybozu.com",
    appId: 5 //https://サブドメイン.cybozu.com/k/n ←nに当たる数字を入力
  },
  obnizId: "3199-7246",
};

const client = new KintoneRestAPIClient({
  baseUrl: Config.kintone.baseUrl,
  auth: {
    apiToken: Config.kintone.apiToken,
  },
});

const sendToKintone = async (temperature, humidity) => {
  // 追加方法についてはこちら
  // https://developer.cybozu.io/hc/ja/articles/202166160-%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AE%E7%99%BB%E9%8C%B2-POST-
  await client.record.addRecord({
    app: Config.kintone.appId,
    record: {
      温度: { value: temperature },
      湿度: { value: humidity },
    },
  });
};

const obniz = new Obniz(Config.obnizId, { local_connect: false });

obniz.onconnect = async () => {
  log("obniz connected");
  await obniz.ble.initWait();
  const MESH_100TH = Obniz.getPartsClass("MESH_100TH");
  obniz.ble.scan.onfind = async (peripheral) => {
    log("name:", peripheral.localName);
    if (!MESH_100TH.isMESHblock(peripheral)) {
      return;
    }
    log("found");

    // Create an instance
    const temphumidBlock = new MESH_100TH(peripheral);

    // Connect to the Brightness block
    await temphumidBlock.connectWait();

    temphumidBlock.onSensorEvent = (temperature, humidity) => {
      log("temperature: " + temperature + ", humidity: " + humidity);
      sendToKintone(temperature, humidity).catch((e) => {
        log("error", e);
      });
    };

    log("connected");

    while (peripheral.connected) {
      const data = await temphumidBlock.getSensorDataWait();
      log("temperature: " + data.temperature + ", humidity: " + data.humidity);
      await sendToKintone(data.temperature, data.humidity);
      await wait(60 * 1000);
    }
  };

  await obniz.ble.scan.startWait(
    { localNamePrefix: "MESH-100" },
    { duration: null }
  );
};

const log = (...args) => {
  console.log(new Date(), ...args);
};
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};


log("program start");