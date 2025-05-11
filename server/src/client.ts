import {
  Agent,
  Request,
  RequestAnnounce,
  RequestGetAllAgents,
  RequestType,
  Response,
  ResponseType,
} from "./types";
import { decodeMessage, encodeMessage } from "./util";

export class SignalingClient {
  private readonly webSocket: WebSocket;

  private constructor(ws: WebSocket) {
    this.webSocket = ws;
  }

  static async connect(url: URL) {
    return new Promise<SignalingClient>((resolve, reject) => {
      const webSocket = new WebSocket(url);
      const connectionErrorHandler = (event: Event) => {
        console.log("Error connecting signaling client:", event);
        reject(event);
      };
      webSocket.addEventListener(
        "open",
        () => {
          webSocket.removeEventListener("error", connectionErrorHandler);

          console.log("Signaling client connected to", webSocket.url);
          const signalingClient = new SignalingClient(webSocket);
          resolve(signalingClient);
        },
        { once: true }
      );
      webSocket.addEventListener("error", connectionErrorHandler, {
        once: true,
      });
      webSocket.addEventListener(
        "close",
        (event) => {
          console.log("Signaling client closed:", event.code, event.reason);
        },
        { once: true }
      );
    });
  }

  private request(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      const requestErrorHandler = (event: Event) => {
        console.log("Error sending request:", event);
        reject(event);
      };
      this.webSocket.addEventListener(
        "message",
        (event) => {
          this.webSocket.removeEventListener("error", requestErrorHandler);
          const response = decodeMessage(event.data);
          console.log("Incoming response", response);
          resolve(response);
        },
        { once: true }
      );
      this.webSocket.addEventListener("error", requestErrorHandler);
      this.webSocket.send(encodeMessage(request));
    });
  }

  async announce(agent: Agent) {
    const request: RequestAnnounce = { type: RequestType.Announce, agent };
    const response = await this.request(request);
    if (response.type === ResponseType.Announce) {
      return Promise.resolve(response.result);
    } else {
      return Promise.reject("Received unexpected response");
    }
  }

  async getAllAgents() {
    const request: RequestGetAllAgents = { type: RequestType.GetAllAgents };
    const response = await this.request(request);
    if (response.type === ResponseType.GetAllAgents) {
      return Promise.resolve(response.agents);
    } else {
      return Promise.reject("Received unexpected response");
    }
  }

  close() {
    this.webSocket.close();
  }
}
