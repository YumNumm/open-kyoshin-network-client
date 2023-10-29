import { SerialPort } from "serialport";
import { checkEnv } from "./util/checkEnv";
import { client } from "./listen";

import * as admin from "firebase-admin";
import { type JmaIntensity, getJmaIntensity } from "./types/jma_intensity";
import { IntensityHandler } from "./handler/intensity";

const port = new SerialPort({
  path: checkEnv(process.env.SERIAL_PATH),
  baudRate: 115200,
});

export const firebaseApp = admin.initializeApp({});

port.on("open", () => {
  console.log("serial port opened");
});

const topic = checkEnv(process.env.BROKER_TOPIC);

// DATA

let lastXsaccSendTime: number | undefined;
let lastJmaIntensity: JmaIntensity | null;
let lastJmaIntensityUpdatedAt: number = Date.now();
let markAsXassDirty = false;

const intensityHandler = new IntensityHandler((intensity: JmaIntensity) => {
  firebaseApp
    .messaging()
    .send({
      topic: "yumnumm-notify",
      notification: {
        title: "🫨 揺れ検出",
        body: `震度${intensity}が観測されました`,
      },
      apns: {
        payload: {
          aps: {
            threadId: "yumnumm",
            mutableContent: true,
            contentAvailable: true,
            sound: {
              critical: true,
              volume: 0.0,
              name: "default",
            },
          },
        },
      },
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.error(err);
    });
});

port.on("data", (data: any) => {
  // split data by comma
  const csv = data
    .toString()
    .replace(/(\r\n|\n|\r)/gm, "")
    .split(",");
  const type = csv[0];
  // console.log(trimmedText);

  switch (type) {
    case "$XSINT": {
      // $XSINT,-1.000,0.40*40
      const realTimeIntensity = parseFloat(csv[2].split("*")[0]);
      const intensity = getJmaIntensity(realTimeIntensity);
      intensityHandler.handle(intensity);
      // only send if it's been more than 2.5 second since last send
      // or if the intensity has changed
      if (
        lastJmaIntensity === null ||
        lastJmaIntensity !== intensity ||
        Date.now() - lastJmaIntensityUpdatedAt > 2500
      ) {
        lastJmaIntensity = intensity;
        lastJmaIntensityUpdatedAt = Date.now();
        client.publish(topic, data);
      }

      break;
    }
    case "$XSACC":
      // only send if it's been more than 0.5 second since last send
      if (
        lastXsaccSendTime === undefined ||
        Date.now() - lastXsaccSendTime > 500 ||
        markAsXassDirty
      ) {
        markAsXassDirty = false;
        client.publish(topic, data);
        lastXsaccSendTime = Date.now();
      }
      break;
    default:
      break;
  }
});

client.on("message", (topic, message) => {
  if (message.toString() === "XSHWI:req") {
    port.write("$XSHWI\r\n");
  }
});
