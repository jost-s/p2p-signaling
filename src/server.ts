import { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { AgentId, RequestType, ResponseType } from "./types.js";
import { decodeMessage, encodeMessage } from "./util.js";

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
        const request = decodeMessage(data);
        console.log("Incoming request", request);

        let response;
        if (request.type === RequestType.Announce) {
          this.agents.set(request.agent.id, socket);
          response = encodeMessage({
            type: ResponseType.Announce,
            result: null,
          });
        } else if (request.type === RequestType.GetAllAgents) {
          const agents = Array.from(this.agents.keys()).map((id) => ({ id }));
          response = encodeMessage({
            type: ResponseType.GetAllAgents,
            agents,
          });
        } else {
          return;
        }
        socket.send(response);
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
