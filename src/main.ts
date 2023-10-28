import { SerialPort } from "serialport";
import { checkEnv } from "./util/checkEnv";
import { client } from "./listen";

const port = new SerialPort({
  path: checkEnv(process.env.SERIAL_PATH),
  baudRate: 115200,
});

port.on("open", () => {
  
  console.log("serial port opened");
});

const topic = checkEnv(process.env.BROKER_TOPIC);

// DATA

let lastXsintText: string | undefined;
let lastXsintSendTime: number | undefined;
let lastXsaccSendTime: number | undefined;
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

  switch (csv[0]) {
    case "$XSINT":
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
      break;
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
