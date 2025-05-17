import { assert, test } from "vitest";
import { SignalingServer } from "../../src";
import { SignalingClient } from "../../src/client";
import { Agent, SignalingType } from "../../src/types";

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
  const server = await SignalingServer.start(TEST_URL);
  const client = await SignalingClient.connect(TEST_URL);

  await client.close();

  try {
    await client.announce({ id: "false" });
    assert.fail("Signaling client should be closed");
  } catch (error) {
    // passed
  }

  await server.close();
});

test("Client can announce", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client = await SignalingClient.connect(TEST_URL);

  let allAgents = await client.getAllAgents();
  assert.deepEqual(allAgents, []);

  const agent: Agent = { id: "peterhahne" };
  await client.announce(agent);

  allAgents = await client.getAllAgents();
  assert.deepEqual(allAgents, [agent]);

  await client.close();
  await server.close();
});

test("Client can send two requests in parallel", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client = await SignalingClient.connect(TEST_URL);

  const agent: Agent = { id: "peterhahne" };
  const [announceResponse, getAllAgentsResponse] = await Promise.all([
    client.announce(agent),
    client.getAllAgents(),
  ]);
  assert.equal(announceResponse, null);
  assert(
    getAllAgentsResponse.length === 0 || getAllAgentsResponse.length === 1
  );

  await client.close();
  await server.close();
});

test("Client can send an RTC offer", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client = await SignalingClient.connect(TEST_URL);
  const receiverId = "receiver";
  await client.announce({ id: receiverId });

  const offer: RTCSessionDescriptionInit = { type: "offer" };
  const response = await client.sendOffer(receiverId, offer);
  assert.equal(response, null);

  await client.close();
  await server.close();
});

test("Client can receive an RTC offer", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client1 = await SignalingClient.connect(TEST_URL);
  await client1.announce(client1.agent);
  const client2 = await SignalingClient.connect(TEST_URL);
  await client2.announce(client2.agent);

  const offer: RTCSessionDescriptionInit = { type: "offer" };

  const offerReceived = new Promise<void>((resolve) => {
    client2.addSignalingListener(SignalingType.Offer, (signalingMessage) => {
      assert(signalingMessage.signaling.type === SignalingType.Offer);
      assert(signalingMessage.signaling.data.sender === client1.agent.id);
      assert(signalingMessage.signaling.data.receiver === client2.agent.id);
      assert.deepEqual(signalingMessage.signaling.data.offer, offer);
      resolve();
    });
  });

  const response = await client1.sendOffer(client2.agent.id, offer);
  assert.equal(response, null);

  await offerReceived;

  await client1.close();
  await client2.close();
  await server.close();
});

test("Client can send an RTC answer", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client = await SignalingClient.connect(TEST_URL);
  const receiverId = "receiver";
  await client.announce({ id: receiverId });

  const answer: RTCSessionDescriptionInit = { type: "answer" };
  const response = await client.sendAnswer(receiverId, answer);
  assert.equal(response, null);

  await client.close();
  await server.close();
});

test.only("Client can receive an RTC answer", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const client1 = await SignalingClient.connect(TEST_URL);
  await client1.announce(client1.agent);
  const client2 = await SignalingClient.connect(TEST_URL);
  await client2.announce(client2.agent);

  const answer: RTCSessionDescriptionInit = { type: "answer" };

  const answerReceived = new Promise<void>((resolve) => {
    client2.addSignalingListener(SignalingType.Answer, (signalingMessage) => {
      assert(signalingMessage.signaling.type === SignalingType.Answer);
      assert(signalingMessage.signaling.data.sender === client1.agent.id);
      assert(signalingMessage.signaling.data.receiver === client2.agent.id);
      assert.deepEqual(signalingMessage.signaling.data.answer, answer);
      resolve();
    });
  });

  const response = await client1.sendAnswer(client2.agent.id, answer);
  assert.equal(response, null);

  await answerReceived;

  await client1.close();
  await client2.close();
  await server.close();
});
