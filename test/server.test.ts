import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../src/index.js";
import {
  Agent,
  AgentId,
  Request,
  RequestAnnounce,
  RequestGetAllAgents,
  RequestType,
  ResponseAnnounce,
  ResponseGetAllAgents,
  ResponseType,
} from "../src/types.js";
import { assertIsResponse, decodeMessage, encodeMessage } from "../src/util.js";

const TEST_URL = new URL("ws://localhost:9000");

test("Server startup and shutdown", async () => {
  const server = await SignalingServer.start(TEST_URL);

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", () => assert.fail());
    ws.on("open", () => resolve());
  });

  await server.close();

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", () => resolve());
    ws.on("open", () => assert.fail());
  });
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
  const request: Request = {
    id: 0,
    type: RequestType.Announce,
    data: { id: agentId },
  };

  const respondedWithSuccess = new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const response = decodeMessage(data);
      assertIsResponse(response);
      assert(response.type === ResponseType.Announce);
      resolve();
    });
  });

  ws.send(encodeMessage(request));

  await respondedWithSuccess;

  ws.close();
  await server.close();
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
  const requestAnnounce: Request = {
    id: 0,
    type: RequestType.Announce,
    data: { id: agent1Id },
  };
  const peerAnnounced = new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const response = decodeMessage(data);
      assertIsResponse(response);
      assert(response.type === ResponseType.Announce);
      assert(response.data === null);
      resolve();
    });
  });
  ws.send(encodeMessage(requestAnnounce));
  await peerAnnounced;

  // Get all agents.
  const requestGetAllAgents: Request = {
    id: 1,
    type: RequestType.GetAllAgents,
    data: undefined,
  };
  const allAgentsReceived = new Promise<Agent[]>((resolve) => {
    ws.once("message", (data) => {
      const response = decodeMessage(data);
      assertIsResponse(response);
      assert(response.type === ResponseType.GetAllAgents);
      assert(Array.isArray(response.data));
      resolve(response.data);
    });
  });
  ws.send(encodeMessage(requestGetAllAgents));
  const agents = await allAgentsReceived;
  console.log("agents", agents);
  assert.deepEqual(agents, [{ id: agent1Id }]);

  ws.close();
  await server.close();
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
