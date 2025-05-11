import { test, assert } from "vitest";
import { WebSocketServer } from "ws";
import { SignalingClient } from "../src/client";
import { SignalingServer } from "../src";
import { Agent } from "../src/types";

const TEST_URL = new URL("ws://localhost:9000");

test("Client can announce", async () => {
  const signalingServer = await SignalingServer.start(TEST_URL);
  const signalingClient = await SignalingClient.connect(TEST_URL);

  let allAgents = await signalingClient.getAllAgents();
  assert.deepEqual(allAgents, []);

  const agent: Agent = { id: "peterhahne" };
  await signalingClient.announce(agent);

  allAgents = await signalingClient.getAllAgents();
  assert.deepEqual(allAgents, [agent]);

  signalingClient.close();
  signalingServer.close();
});
