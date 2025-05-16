import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../../src/server.js";
import {
  AgentId,
  RequestMessage,
  RequestType,
  ResponseType,
} from "../../src/types.js";
import {
  decodeResponseMessage,
  decodeSignalingMessage,
  encodeRequestMessage,
} from "../../src/util.js";
import { SignalingType } from "../../src/types-signaling.js";

const TEST_URL = new URL("ws://localhost:9000");

test("RTC offer to unregistered agent fails", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const [agent] = await createAgents(1);
  await new Promise<string>((resolve) => {
    const sendOfferMessage: RequestMessage = {
      id: 0,
      request: {
        type: RequestType.SendOffer,
        data: {
          type: SignalingType.Offer,
          data: {
            sender: agent.agentId,
            receiver: "unregisteredAgent",
            offer: { type: "offer" },
          },
        },
      },
    };
    agent.ws.once("message", (data) => {
      const message = decodeResponseMessage(data);
      assert(message.response.type === ResponseType.Error);
      assert.equal(
        message.response.data,
        "Target agent not registered on server"
      );
      resolve(message.response.data);
    });
    agent.ws.send(encodeRequestMessage(sendOfferMessage));
  });

  agent.ws.close();
  await server.close();
});

test("RTC offer is forwarded to target agent", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const [agent1, agent2] = await createAgents(2);

  const offer: RTCSessionDescriptionInit = {
    type: "offer",
    sdp: "some_connection_details",
  };

  const offerReceived = new Promise((resolve) => {
    agent2.ws.on("message", (data) => {
      const message = decodeSignalingMessage(data);
      assert(message.type === SignalingType.Offer);
      assert.deepEqual(message.data.offer, offer);
      resolve(data);
    });
  });

  const offerMessage: RequestMessage = {
    id: 1,
    request: {
      type: RequestType.SendOffer,
      data: {
        type: SignalingType.Offer,
        data: {
          sender: agent1.agentId,
          receiver: agent2.agentId,
          offer,
        },
      },
    },
  };
  const offerRequestResponse = await new Promise<null>((resolve) => {
    agent1.ws.once("message", (data) => {
      const message = decodeResponseMessage(data);
      assert(message.response.type === ResponseType.SendOffer);
      resolve(message.response.data);
    });
    agent1.ws.send(encodeRequestMessage(offerMessage));
  });
  assert.equal(offerRequestResponse, null);

  await offerReceived;

  agent1.ws.close();
  agent2.ws.close();
  await server.close();
});

test("RTC answer to unregistered agent fails", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const [agent] = await createAgents(1);
  await new Promise<string>((resolve) => {
    const sendAnswerMessage: RequestMessage = {
      id: 0,
      request: {
        type: RequestType.SendAnswer,
        data: {
          type: SignalingType.Answer,
          data: {
            sender: agent.agentId,
            receiver: "unregisteredAgent",
            answer: { type: "answer" },
          },
        },
      },
    };
    agent.ws.once("message", (data) => {
      const message = decodeResponseMessage(data);
      assert(message.response.type === ResponseType.Error);
      assert.equal(
        message.response.data,
        "Target agent not registered on server"
      );
      resolve(message.response.data);
    });
    agent.ws.send(encodeRequestMessage(sendAnswerMessage));
  });

  agent.ws.close();
  await server.close();
});

test("RTC answer is forwarded to target agent", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const [agent1, agent2] = await createAgents(2);

  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: "some_connection_details",
  };

  const answerReceived = new Promise((resolve) => {
    agent2.ws.on("message", (data) => {
      const message = decodeSignalingMessage(data);
      assert(message.type === SignalingType.Answer);
      assert.deepEqual(message.data.answer, answer);
      resolve(data);
    });
  });

  const answerMessage: RequestMessage = {
    id: 1,
    request: {
      type: RequestType.SendAnswer,
      data: {
        type: SignalingType.Answer,
        data: {
          sender: agent1.agentId,
          receiver: agent2.agentId,
          answer,
        },
      },
    },
  };
  const answerRequestResponse = await new Promise<null>((resolve) => {
    agent1.ws.once("message", (data) => {
      const message = decodeResponseMessage(data);
      assert(message.response.type === ResponseType.SendAnswer);
      resolve(message.response.data);
    });
    agent1.ws.send(encodeRequestMessage(answerMessage));
  });
  assert.equal(answerRequestResponse, null);

  await answerReceived;

  agent1.ws.close();
  agent2.ws.close();
  await server.close();
});

const createAgents = async (
  amount: number,
  announceAgent = true,
  server_url?: URL
) => {
  server_url = server_url ?? TEST_URL;

  return Promise.all(
    new Array(amount).fill(0).map(async (_, i) => {
      // Connect agent websocket.
      const ws = await new Promise<WebSocket>((resolve) => {
        const ws = new WebSocket(server_url);
        ws.once("open", () => {
          resolve(ws);
        });
      });
      const agentId: AgentId = `agent-${i}`;

      if (announceAgent) {
        // Announce agent.
        const requestAnnounceAgent: RequestMessage = {
          id: 0,
          request: {
            type: RequestType.Announce,
            data: { id: agentId },
          },
        };
        await new Promise<null>((resolve) => {
          ws.once("message", (data) => {
            const response = decodeResponseMessage(data);
            assert(response.response.type === ResponseType.Announce);
            resolve(response.response.data);
          });
          ws.send(encodeRequestMessage(requestAnnounceAgent));
        });
      }

      return { ws, agentId };
    })
  );
};
