import { IncomingMessage } from "http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import {
  Agent,
  AgentId,
  Message,
  MessageType,
  RequestType,
  ResponseType,
  SignalingMessage,
  type Response,
  type ResponseMessage,
} from "./types/index.js";
import {
  decodeMessage,
  encodeResponseMessage,
  encodeSignalingMessage,
  formatError,
} from "./util.js";

export class SignalingServer {
  private readonly wss: WebSocketServer;
  private agents: Map<AgentId, [Agent, WebSocket]>;

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
        let message: Message;
        try {
          message = decodeMessage(data);
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            socket.send(error.message);
          }
          return;
        }

        if (message.type === MessageType.Request) {
          console.log("Incoming request", message);

          let response: Response;
          if (
            message.request.type === RequestType.Announce &&
            typeof message.request.data === "object"
          ) {
            this.agents.set(message.request.data.id, [
              message.request.data,
              socket,
            ]);
            response = {
              type: ResponseType.Announce,
              data: null,
            };
          } else if (message.request.type === RequestType.GetAllAgents) {
            const agents = Array.from(this.agents.values()).map(
              (value) => value[0]
            );
            response = {
              type: ResponseType.GetAllAgents,
              data: agents,
            };
          } else if (
            message.request.type === RequestType.SendOffer ||
            message.request.type === RequestType.SendAnswer
          ) {
            const targetAgentWs = this.agents.get(
              message.request.data.data.receiver
            )?.[1];
            if (targetAgentWs) {
              const signalingMessage: SignalingMessage = {
                type: MessageType.Signaling,
                signaling: message.request.data,
              };
              targetAgentWs.send(encodeSignalingMessage(signalingMessage));
              response = {
                type:
                  message.request.type === RequestType.SendOffer
                    ? ResponseType.SendOffer
                    : ResponseType.SendAnswer,
                data: null,
              };
            } else {
              console.error(
                "Target agent",
                message.request.data.data.receiver,
                "not registered on server"
              );
              response = {
                type: ResponseType.Error,
                data: "Target agent not registered on server",
              };
            }
          } else {
            console.error(`Unexpected request type: ${formatError(message)}`);
            return;
          }
          const responseMessage: ResponseMessage = {
            type: MessageType.Response,
            id: message.id,
            response,
          };
          socket.send(encodeResponseMessage(responseMessage));
        } else {
        }
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
