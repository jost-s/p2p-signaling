import { test, assert } from "vitest";
import { WebSocketServer } from "ws";
import { SignalingClient } from "../src/client";
import { SignalingServer } from "../src";
import { Agent } from "../src/types";

const TEST_URL = new URL("ws://localhost:9000");

test("Client connection error is handled", async () => {
  try {
    await SignalingClient.connect(new URL("ws://localhost:1000"));
    assert.fail("Connection should have failed");
  } catch (error) {
    // passed
  }
});

test("Client connection can be closed", async () => {
  const signalingServer = await SignalingServer.start(TEST_URL);
  const signalingClient = await SignalingClient.connect(TEST_URL);

  await signalingClient.close();

  try {
    await signalingClient.announce({ id: "false" });
    assert.fail("Signaling client should be closed");
  } catch (error) {
    // passed
  }

  signalingServer.close();
});

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

test("Client can send two requests in parallel", async () => {
  const signalingServer = await SignalingServer.start(TEST_URL);
  const signalingClient = await SignalingClient.connect(TEST_URL);

  const agent: Agent = { id: "peterhahne" };
  const [announceResponse, getAllAgentsResponse] = await Promise.all([
    signalingClient.announce(agent),
    signalingClient.getAllAgents(),
  ]);
  assert.equal(announceResponse, null);
  assert(
    getAllAgentsResponse.length === 0 || getAllAgentsResponse.length === 1
  );

  signalingClient.close();
  signalingServer.close();
});
