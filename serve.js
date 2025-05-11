import { SignalingServer } from "./lib/server.js";

const server = await SignalingServer.start(new URL("ws://localhost:9000"));
