import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../../src/index.js";
import {
  Agent,
  MessageType,
  RequestMessage,
  RequestType,
  ResponseType,
} from "../../src/types/index.js";
import {
  decodeMessage,
  encodeRequestMessage,
  formatError,
} from "../../src/util.js";
import { getServerUrl } from "../util.js";

test("Server startup and shutdown", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("error", () => assert.fail());
    ws.on("open", () => resolve(ws));
  });
  ws.close();

  await server.close();

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("error", () => resolve());
    ws.on("open", () => assert.fail());
  });
});

test("Unknown message format does not crash server", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
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
      const message = decodeMessage(data.toString());
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.GetAllAgents);
      resolve(message.response.data);
    });
    ws.send(encodeRequestMessage(requestGetAllAgents));
  });

  await server.close();
});

test("Agent can announce", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce with ID returns a success message.
  const agent: Agent = { id: "peterhahne", name: "" };
  const request: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.Announce,
      data: agent,
    },
  };

  const response = await new Promise<null>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data.toString());
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
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce one agent.
  const agent = { id: "peterhahne", name: "" };
  const requestAnnounce: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.Announce,
      data: agent,
    },
  };
  await new Promise<void>((resolve) => {
    ws.once("message", (data) => {
      const message = decodeMessage(data.toString());
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
      const message = decodeMessage(data.toString());
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.GetAllAgents);
      resolve(message.response.data);
    });
    ws.send(encodeRequestMessage(requestGetAllAgents));
  });
  assert.deepEqual(allAgents, [agent]);

  ws.close();
  await server.close();
});
