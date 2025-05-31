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
import { MAX_EXPIRY_MS } from "../../src/server.js";

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
  const agent: Agent = {
    id: "peterhahne",
    name: "",
    expiry: Date.now() + 1000,
  };
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
  const agent: Agent = {
    id: "peterhahne",
    name: "",
    expiry: Date.now() + 1000,
  };
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

test("Announce with agent expiry greater than max is rejected", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce agent with excessive expiry.
  const agent: Agent = {
    id: "peterhahne",
    name: "",
    expiry: Date.now() + MAX_EXPIRY_MS + 10,
  };
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
      assert(message.response.type === ResponseType.Error);
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

  // Agent should not have been registered.
  assert.deepEqual(allAgents, []);

  ws.close();
  await server.close();
});

test("Expired agents are pruned", async () => {
  const serverUrl = await getServerUrl();
  const server = await SignalingServer.start(serverUrl);

  const ws = await new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(serverUrl);
    ws.on("open", () => {
      resolve(ws);
    });
  });

  // Announce one expiring agent.
  const expiringAgent: Agent = {
    id: "peterhahne",
    name: "",
    expiry: Date.now(),
  };
  const requestAnnounce: RequestMessage = {
    type: MessageType.Request,
    id: 0,
    request: {
      type: RequestType.Announce,
      data: expiringAgent,
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

  // Announce one non-expiring agent.
  const agent: Agent = { id: "klaus", name: "", expiry: Date.now() + 1000 };
  requestAnnounce.request.data = agent;
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

  // Expiring agent should be gone and non-expiring agent should be present.
  assert.deepEqual(allAgents, [agent]);

  ws.close();
  await server.close();
});
