import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../../src/index.js";
import {
  Agent,
  AgentId,
  MessageType,
  RequestMessage,
  RequestType,
  ResponseType,
} from "../../src/types/index.js";
import {
  formatError,
  decodeMessage,
  encodeRequestMessage,
} from "../../src/util.js";

const TEST_URL = new URL("ws://localhost:9000");

test("Server startup and shutdown", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", () => assert.fail());
    ws.on("open", () => resolve(ws));
  });
  ws.close();

  await server.close();

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("error", () => resolve());
    ws.on("open", () => assert.fail());
  });
});

test("Unknown message format does not crash server", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  const unknownRequest = { unknown: "message" };
  const errorResponse = await new Promise((resolve) => {
    ws.once("message", (data) => {
      const error = data.toString();
      resolve(error);
    });
    ws.send(JSON.stringify(unknownRequest));
  });
  assert.deepEqual(
    errorResponse,
    `Unknown message format: ${formatError(unknownRequest)}`
  );

  // Getting all agents still works.
  const requestGetAllAgents: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.GetAllAgents,
      data: null,
    },
  };
  await new Promise<Agent[]>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.GetAllAgents);
      resolve(message.response.data);
    });
    ws.send(encodeRequestMessage(requestGetAllAgents));
  });

  await server.close();
});

test("Agent can announce", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce with ID returns a success message.
  const agentId: AgentId = "peterhahne";
  const request: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.Announce,
      data: { id: agentId },
    },
  };

  const response = await new Promise<null>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.Announce);
      resolve(message.response.data);
    });
    ws.send(encodeRequestMessage(request));
  });
  assert.equal(response, null);

  ws.close();
  await server.close();
});

test("Get all agents", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(TEST_URL);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce one agent.
  const agent1Id: AgentId = "peterhahne";
  const requestAnnounce: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.Announce,
      data: { id: agent1Id },
    },
  };
  await new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.Announce);
      resolve();
    });
    ws.send(encodeRequestMessage(requestAnnounce));
  });

  // Get all agents.
  const requestGetAllAgents: RequestMessage = {
    type: MessageType.Request,
    id: 1,
    request: {
      type: RequestType.GetAllAgents,
      data: null,
    },
  };
  const allAgents = await new Promise<Agent[]>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.GetAllAgents);
      resolve(message.response.data);
    });
    ws.send(encodeRequestMessage(requestGetAllAgents));
  });
  assert.deepEqual(allAgents, [{ id: agent1Id }]);

  ws.close();
  await server.close();
});
