import { SerialPort } from "serialport";
import { checkEnv } from "./util/checkEnv";
import { client } from "./listen";

import * as admin from "firebase-admin";

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

let lastXsintText: string | undefined;
let lastXsintSendTime: number | undefined;
let lastXsaccSendTime: number | undefined;
let lastJmaIntensity: JmaForecastIntensity | undefined;
let markAsXassDirty = false;

port.on("data", (data: string) => {
  // split data by comma
  const csv = (
    "$" +
    data
      .toString()
      .replace(/(\r\n|\n|\r)/gm, "")
      .split("$")[1]
  ).split(",");
  const trimmedText = csv.join(",");
  // console.log(trimmedText);
  console.log(csv);

  switch (csv[0]) {
    case "$XSINT": {
      // only send if it's been more than 2.5 second since last send
      if (
        lastXsintText !== trimmedText ||
        lastXsintSendTime === undefined ||
        Date.now() - lastXsintSendTime > 2500
      ) {
        if (lastXsintText !== trimmedText) {
          markAsXassDirty = true;
        }
        client.publish(topic, trimmedText);
        lastXsintText = trimmedText;
        lastXsintSendTime = Date.now();
      }
      const intensity = toJmaIntensity(parseFloat(csv[2].split("*")[0]));
      if (intensity !== lastJmaIntensity) {
        lastJmaIntensity = intensity;
        if (
          intensity !== undefined &&
          intensity !== JmaForecastIntensity.zero
        ) {
          // FCM NOTIFY
          firebaseApp
            .messaging()
            .send({
              topic: "yumnumm-notify",
              notification: {
                title: "揺れ検出 🫨",
                body: `震度${intensity}が観測されました。 ( ${csv[1]} )`,
              },
              apns: {
                payload: {
                  aps: {
                    threadId: "yumnumm",
                    alert: {
                      title: "揺れ検出 🫨",
                      body: `震度${intensity}が観測されました。 ( ${csv[1]} )`,
                      subtitle: "自宅 Raspberry PI 4",
                    },
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
        }
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
        client.publish(topic, trimmedText);
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

function toJmaIntensity(param: number): JmaForecastIntensity | undefined {
  /*
    JmaForecastIntensity? get toJmaForecastIntensity => switch (this) {
        < -0.5 => null,
        < 0.5 => JmaForecastIntensity.zero,
        < 1.5 => JmaForecastIntensity.one,
        < 2.5 => JmaForecastIntensity.two,
        < 3.5 => JmaForecastIntensity.three,
        < 4.5 => JmaForecastIntensity.four,
        < 5.0 => JmaForecastIntensity.fiveLower,
        < 5.5 => JmaForecastIntensity.fiveUpper,
        < 6.0 => JmaForecastIntensity.sixLower,
        < 6.5 => JmaForecastIntensity.sixUpper,
        _ => JmaForecastIntensity.seven,
      };
  */
  if (param < -0.5) {
    return undefined;
  } else if (param < 0.5) {
    return JmaForecastIntensity.zero;
  } else if (param < 1.5) {
    return JmaForecastIntensity.one;
  } else if (param < 2.5) {
    return JmaForecastIntensity.two;
  } else if (param < 3.5) {
    return JmaForecastIntensity.three;
  } else if (param < 4.5) {
    return JmaForecastIntensity.four;
  } else if (param < 5.0) {
    return JmaForecastIntensity.fiveLower;
  } else if (param < 5.5) {
    return JmaForecastIntensity.fiveUpper;
  } else if (param < 6.0) {
    return JmaForecastIntensity.sixLower;
  } else if (param < 6.5) {
    return JmaForecastIntensity.sixUpper;
  } else {
    return JmaForecastIntensity.seven;
  }
}

enum JmaForecastIntensity {
  zero,
  one,
  two,
  three,
  four,
  fiveLower,
  fiveUpper,
  sixLower,
  sixUpper,
  seven,
}
