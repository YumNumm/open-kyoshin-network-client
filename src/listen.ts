// import mqtt
import * as mqtt from "mqtt";
import { checkEnv } from "./util/checkEnv";

// create client
const uri = checkEnv(process.env.BROKER_URI);

// Any username and your token from the /brokers/YOUR_BROKER/credentials endpoint
// The token should be the base64-encoded JWT issued by the Pub/Sub API
const username = "anything";
const password = checkEnv(process.env.BROKER_TOKEN);

// Specify a topic name to subscribe to and publish on
const topic = checkEnv(process.env.BROKER_TOPIC);

// Configure and create the MQTT client
export const client = mqtt.connect(uri, {
  protocolVersion: 5,
  port: 8883,
  clean: true,
  connectTimeout: 2000, // 2 seconds
  clientId: "",
  username,
  password,
});

// Emit errors and exit
client.on("error", (err: Error | mqtt.ErrorWithReasonCode) => {
  console.log(`⚠️  error: ${err.message}`);
  client.end();
  process.exit();
});

// Connect to your broker
client.on("connect", () => {
  console.log(`🌎 connected to ${process.env.BROKER_URI}!`);
  // Subscribe to a topic
});

client.subscribe(topic, (err) => {
  if (err == null) {
    console.log(`✅ subscribed to ${topic}`);
    // Publish a message!
    client.publish(topic, "Hello, world! from Node.js MQTT client");
  }
});

client.on("offline", () => {
  console.log(`❌ offline`);
});
