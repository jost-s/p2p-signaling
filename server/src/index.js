import { WebSocketServer } from "ws";
import {
  decodeMessage,
  encodeMessage,
  getResponse,
  messageType,
  requestType,
  responseType,
} from "./util";

export class SignalingServer {
  #wss;
  #agents;

  constructor(wss) {
    this.#wss = wss;
    this.#agents = new Map();
  }

  static async start() {
    const started = new Promise((resolve, reject) => {
      const wss = new WebSocketServer({ port: 9000 });
      const signalingServer = new SignalingServer(wss);
      wss.on("listening", () => {
        console.log("socket server listening on", wss.address());
        resolve(signalingServer);
      });
      wss.on("error", (error) => {
        console.error(error);
        reject(error);
      });
      wss.on("close", () => {
        console.log("closed");
      });

      wss.on("connection", (socket, req) => {
        console.log("connection", req.socket.remoteAddress);

        console.log("clients", wss.clients.size);

        socket.on("error", (error) => console.error(error));

        socket.on("message", (data) => {
          const request = decodeMessage(data);
          console.log("response", request);

          let response;
          if (request.type === requestType.announce) {
            signalingServer.#agents.set(request.agent.id, socket);
            response = encodeMessage({
              type: responseType.announce,
              result: null,
            });
          } else if (request.type === requestType.getAllAgents) {
            const agents = Array.from(signalingServer.#agents.keys()).map(
              (id) => ({ id })
            );
            response = encodeMessage({
              type: responseType.getAllAgents,
              agents,
            });
          } else {
            return;
          }
          socket.send(response);
        });
      });
    });

    return started;
  }

  close() {
    this.#wss.close();
  }
}
