import { assert, test } from "vitest";
import { SignalingClient } from "../../src/client.js";
import { SignalingServer } from "../../src/server.js";
import { Agent, SignalingType } from "../../src/types/index.js";
import { fakeIceCandidate, getServerUrl } from "../util.js";

const TEST_AGENT: Agent = { id: "peterhahne", name: "" };

test("Client connection error is handled", async () => {
  try {
    await SignalingClient.connect(new URL("ws://localhost:1000"), TEST_AGENT);
    assert.fail("Connection should have failed");
  } catch (error) {
    // passed
  }
});

test("Client connection can be closed", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client = await SignalingClient.connect(serverUrl, TEST_AGENT);

  await client.close();

  try {
    await client.announce();
    assert.fail("Signaling client should be closed");
  } catch (error) {
    // passed
  }

  await server.close();
});

test("Client can announce", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const agent: Agent = { id: "peterhahne", name: "" };
  const client = await SignalingClient.connect(serverUrl, agent);

  let allAgents = await client.getAllAgents();
  assert.deepEqual(allAgents, []);

  await client.announce();

  allAgents = await client.getAllAgents();
  assert.deepEqual(allAgents, [agent]);

  await client.close();
  await server.close();
});

test("Client can send two requests in parallel", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client = await SignalingClient.connect(serverUrl, TEST_AGENT);

  const [announceResponse, getAllAgentsResponse] = await Promise.all([
    client.announce(),
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
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

  const offer: RTCSessionDescriptionInit = { type: "offer" };
  const response = await client1.sendOffer(client2.agent.id, offer);
  assert.equal(response, null);

  await client1.close();
  await client2.close();
  await server.close();
});

test("Client can receive an RTC offer", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

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
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

  const answer: RTCSessionDescriptionInit = { type: "answer" };
  const response = await client1.sendAnswer(client2.agent.id, answer);
  assert.equal(response, null);

  await client1.close();
  await client2.close();
  await server.close();
});

test("Client can receive an RTC answer", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

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

test("Client can send an RTC ICE candidate", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

  const iceCandidate = fakeIceCandidate();
  const response = await client1.sendIceCandidate(
    client2.agent.id,
    iceCandidate
  );
  assert.equal(response, null);

  await client1.close();
  await client2.close();
  await server.close();
});

test("Client can receive an RTC ICE candidate", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);
  const client1 = await SignalingClient.connect(serverUrl, {
    id: "1",
    name: "",
  });
  await client1.announce();
  const client2 = await SignalingClient.connect(serverUrl, {
    id: "2",
    name: "",
  });
  await client2.announce();

  const iceCandidate = fakeIceCandidate();

  const iceCandidateReceived = new Promise<void>((resolve) => {
    client2.addSignalingListener(
      SignalingType.IceCandidate,
      (signalingMessage) => {
        assert(signalingMessage.signaling.type === SignalingType.IceCandidate);
        assert(signalingMessage.signaling.data.sender === client1.agent.id);
        assert(signalingMessage.signaling.data.receiver === client2.agent.id);
        // Cannot stringify/parse back the toJSON function.
        const iceCandidateWithoutToJSONFn: any = iceCandidate;
        delete iceCandidateWithoutToJSONFn.toJSON;
        assert.deepEqual(
          signalingMessage.signaling.data.iceCandidate,
          iceCandidateWithoutToJSONFn
        );
        resolve();
      }
    );
  });

  const response = await client1.sendIceCandidate(
    client2.agent.id,
    iceCandidate
  );
  assert.equal(response, null);

  await iceCandidateReceived;

  await client1.close();
  await client2.close();
  await server.close();
});
