import { assert, test } from "vitest";
import { WebSocket } from "ws";
import { SignalingServer } from "../../src/server.js";
import {
  Agent,
  AgentId,
  MessageType,
  RequestMessage,
  RequestType,
  ResponseType,
  SignalingType,
} from "../../src/types/index.js";
import { decodeMessage, encodeRequestMessage } from "../../src/util.js";

const TEST_URL = new URL("ws://localhost:9000");

test("RTC offer to unregistered agent fails", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const [client] = await createClients(1);
  await new Promise<string>((resolve) => {
    const sendOfferMessage: RequestMessage = {
      type: MessageType.Request,
      id: 0,
      request: {
        type: RequestType.SendOffer,
        data: {
          type: SignalingType.Offer,
          data: {
            sender: client.agent.id,
            receiver: "unregisteredAgent",
            offer: { type: "offer" },
          },
        },
      },
    };
    client.ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.Error);
      assert.equal(
        message.response.data,
        "Target agent not registered on server"
      );
      resolve(message.response.data);
    });
    client.ws.send(encodeRequestMessage(sendOfferMessage));
  });

  client.ws.close();
  await server.close();
});

test("RTC offer is forwarded to target agent", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const [client1, client2] = await createClients(2);

  const offer: RTCSessionDescriptionInit = {
    type: "offer",
    sdp: "some_connection_details",
  };

  const offerReceived = new Promise((resolve) => {
    client2.ws.on("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Signaling);
      assert(message.signaling.type === SignalingType.Offer);
      assert.deepEqual(message.signaling.data.offer, offer);
      resolve(data);
    });
  });

  const offerMessage: RequestMessage = {
    type: MessageType.Request,
    id: 1,
    request: {
      type: RequestType.SendOffer,
      data: {
        type: SignalingType.Offer,
        data: {
          sender: client1.agent.id,
          receiver: client2.agent.id,
          offer,
        },
      },
    },
  };
  const offerRequestResponse = await new Promise<null>((resolve) => {
    client1.ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.SendOffer);
      resolve(message.response.data);
    });
    client1.ws.send(encodeRequestMessage(offerMessage));
  });
  assert.equal(offerRequestResponse, null);

  await offerReceived;

  client1.ws.close();
  client2.ws.close();
  await server.close();
});

test("RTC answer to unregistered agent fails", async () => {
  const server = await SignalingServer.start(TEST_URL);

  const [client] = await createClients(1);
  await new Promise<string>((resolve) => {
    const sendAnswerMessage: RequestMessage = {
      type: MessageType.Request,
      id: 0,
      request: {
        type: RequestType.SendAnswer,
        data: {
          type: SignalingType.Answer,
          data: {
            sender: client.agent.id,
            receiver: "unregisteredAgent",
            answer: { type: "answer" },
          },
        },
      },
    };
    client.ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.Error);
      assert.equal(
        message.response.data,
        "Target agent not registered on server"
      );
      resolve(message.response.data);
    });
    client.ws.send(encodeRequestMessage(sendAnswerMessage));
  });

  client.ws.close();
  await server.close();
});

test("RTC answer is forwarded to target agent", async () => {
  const server = await SignalingServer.start(TEST_URL);
  const [client1, client2] = await createClients(2);

  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: "some_connection_details",
  };

  const answerReceived = new Promise((resolve) => {
    client2.ws.on("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Signaling);
      assert(message.signaling.type === SignalingType.Answer);
      assert.deepEqual(message.signaling.data.answer, answer);
      resolve(data);
    });
  });

  const answerMessage: RequestMessage = {
    type: MessageType.Request,
    id: 1,
    request: {
      type: RequestType.SendAnswer,
      data: {
        type: SignalingType.Answer,
        data: {
          sender: client1.agent.id,
          receiver: client2.agent.id,
          answer,
        },
      },
    },
  };
  const answerRequestResponse = await new Promise<null>((resolve) => {
    client1.ws.once("message", (data) => {
      const message = decodeMessage(data);
      assert(message.type === MessageType.Response);
      assert(message.response.type === ResponseType.SendAnswer);
      resolve(message.response.data);
    });
    client1.ws.send(encodeRequestMessage(answerMessage));
  });
  assert.equal(answerRequestResponse, null);

  await answerReceived;

  client1.ws.close();
  client2.ws.close();
  await server.close();
});

const createClients = async (
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
      const agent: Agent = { id: `agent-${i}`, name: "" };

      if (announceAgent) {
        // Announce agent.
        const requestAnnounceAgent: RequestMessage = {
          type: MessageType.Request,
          id: 0,
          request: {
            type: RequestType.Announce,
            data: agent,
          },
        };
        await new Promise<null>((resolve) => {
          ws.once("message", (data) => {
            const message = decodeMessage(data);
            assert(message.type === MessageType.Response);
            assert(message.response.type === ResponseType.Announce);
            resolve(message.response.data);
          });
          ws.send(encodeRequestMessage(requestAnnounceAgent));
        });
      }

      return { ws, agent };
    })
  );
};
