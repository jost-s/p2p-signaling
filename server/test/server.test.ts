import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../src/index.js";
import { decodeMessage, encodeMessage } from "../src/util.js";
import {
  Agent,
  AgentId,
  RequestAnnounce,
  RequestGetAllAgents,
  RequestType,
  ResponseAnnounce,
  ResponseGetAllAgents,
  ResponseType,
} from "../src/types.js";

const TEST_URL = new URL("ws://localhost:9000");

test("Server startup and shutdown", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const connected = new Promise<void>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", (error) => assert.fail());
    ws.on("open", () => {
      resolve();
    });
  });
  await connected;

  server.close();

  const closed = new Promise<void>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", () => resolve());
    ws.on("open", () => assert.fail());
  });
  await closed;
});

test("Agent can announce", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const connected = new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("open", () => {
      resolve(ws);
    });
  });
  const ws = await connected;

  // Announce with ID returns a success message.
  const agentId: AgentId = "peterhahne";
  const request: RequestAnnounce = {
    type: RequestType.Announce,
    agent: { id: agentId },
  };

  const respondedWithSuccess = new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const response: ResponseAnnounce = decodeMessage(data);
      assert(response.type === ResponseType.Announce);
      assert(response.result === null);
      resolve();
    });
  });

  ws.send(encodeMessage(request));

  await respondedWithSuccess;

  ws.close();
  server.close();
});

test("Get all peers", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const connected = new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("open", () => {
      resolve(ws);
    });
  });
  const ws = await connected;

  // Announce one agent.
  const agent1Id: AgentId = "peterhahne";
  const requestAnnounce: RequestAnnounce = {
    type: RequestType.Announce,
    agent: { id: agent1Id },
  };
  const peerAnnounced = new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const response: ResponseAnnounce = decodeMessage(data);
      assert(response.type === ResponseType.Announce);
      assert(response.result === null);
      resolve();
    });
  });
  ws.send(encodeMessage(requestAnnounce));
  await peerAnnounced;

  // Get all agents.
  const requestGetAllAgents: RequestGetAllAgents = {
    type: RequestType.GetAllAgents,
  };
  const allAgentsReceived = new Promise<Agent[]>((resolve) => {
    ws.once("message", (data) => {
      const response: ResponseGetAllAgents = decodeMessage(data);
      assert(response.type === ResponseType.GetAllAgents);
      resolve(response.agents);
    });
  });
  ws.send(encodeMessage(requestGetAllAgents));
  const agents = await allAgentsReceived;
  console.log("agents", agents);
  assert.deepEqual(agents, [{ id: agent1Id }]);

  ws.close();
  server.close();
});

// test("RTC offer is forwarded to target", async () => {
//   const server = await SignalingServer.start();

//   const sdpOfferJson = JSON.stringify({ type: "offer" });
//   const target = "peer2";

//   const connected = new Promise((resolve) => {
//     const ws = new WebSocket(new URL("ws://localhost:9000"), {});
//     ws.on("open", () => {
//       resolve(ws);
//     });
//   });
//   const ws = await connected;
//   ws.send()

//   server.close();
// });
