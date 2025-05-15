import { IncomingMessage } from "http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import {
  AgentId,
  RequestMessage,
  RequestType,
  Response,
  ResponseMessage,
  ResponseType,
} from "./types.js";
import {
  decodeRequestMessage,
  encodeError,
  encodeResponseMessage,
  encodeSignalingMessage,
} from "./util.js";
import { SignalingMessage, SignalingMessageType } from "./types-signaling.js";

export class SignalingServer {
  private readonly wss: WebSocketServer;
  private agents: Map<AgentId, WebSocket>;

  private constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.agents = new Map();

    this.registerConnectionListener();
  }

  private registerConnectionListener() {
    this.wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
      console.log("Incoming connection from", req.socket.remoteAddress);

      console.log("Connected clients:", this.wss.clients?.size);

      socket.on("error", (error) => console.error(error));

      socket.on("message", (data) => {
        let requestMessage: RequestMessage;
        try {
          requestMessage = decodeRequestMessage(data);
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            socket.send(encodeError(error));
          }
          return;
        }
        console.log("Incoming request", requestMessage);

        let response: Response;
        if (
          requestMessage.request.type === RequestType.Announce &&
          typeof requestMessage.request.data === "object"
        ) {
          this.agents.set(requestMessage.request.data.id, socket);
          response = {
            type: ResponseType.Announce,
            data: null,
          };
        } else if (requestMessage.request.type === RequestType.GetAllAgents) {
          const agents = Array.from(this.agents.keys()).map((id) => ({ id }));
          response = {
            type: ResponseType.GetAllAgents,
            data: agents,
          };
        } else if (requestMessage.request.type === RequestType.SendOffer) {
          const targetAgentWs = this.agents.get(
            requestMessage.request.data.receiver
          );
          if (targetAgentWs) {
            const signalingMessage: SignalingMessage = {
              type: SignalingMessageType.Offer,
              signaling: requestMessage.request.data,
            };
            targetAgentWs.send(encodeSignalingMessage(signalingMessage));
            response = {
              type: ResponseType.SendOffer,
              data: null,
            };
          } else {
            response = {
              type: ResponseType.Error,
              data: "Target agent not registered on server",
            };
          }
        } else {
          console.error(
            `Unexpected request type: ${JSON.stringify(
              requestMessage,
              null,
              4
            )}`
          );
          return;
        }
        const responseMessage: ResponseMessage = {
          id: requestMessage.id,
          response,
        };
        socket.send(encodeResponseMessage(responseMessage));
      });
    });
  }

  static async start(url: URL) {
    return new Promise<SignalingServer>((resolve, reject) => {
      const wss = new WebSocketServer({
        host: url.hostname,
        port: parseInt(url.port),
      });
      const signalingServer = new SignalingServer(wss);
      wss.once("listening", () => {
        console.log("Signaling server listening at", wss.address());
        resolve(signalingServer);
      });
      wss.on("error", (error) => {
        console.error(error);
        reject(error);
      });
    });
  }

  async close() {
    return new Promise<void>((resolve) => {
      this.wss.once("close", () => {
        console.log("Signaling server closed");
        resolve();
      });
      console.log("Closing all client connections");
      this.wss.clients.forEach((client) => client.close());
      this.wss.close();
    });
  }
}
