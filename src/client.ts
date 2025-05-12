import {
  Agent,
  Request,
  RequestType,
  Response,
  ResponseType,
} from "./types.js";
import { assertIsResponse, decodeMessage, encodeMessage } from "./util.js";

type RequestResolveFn = (value: Response) => void;
type RequestRejectFn = (reason?: any) => void;

export class SignalingClient {
  private readonly webSocket: WebSocket;
  private requestIndex: number;
  private readonly requests: Map<
    number,
    { resolve: RequestResolveFn; reject: RequestRejectFn }
  >;

  private constructor(ws: WebSocket) {
    this.webSocket = ws;
    this.webSocket.addEventListener("message", this.messageListener);
    this.requestIndex = 0;
    this.requests = new Map();
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
    });
  }

  private messageListener = (event: MessageEvent) => {
    const response = decodeMessage(event.data);
    assertIsResponse(response);
    console.log("Incoming response", response);
    const pendingRequest = this.requests.get(response.id);
    if (pendingRequest) {
      pendingRequest.resolve(response);
      this.requests.delete(response.id);
    } else {
      console.error(
        `Received response to an unknown request: ${JSON.stringify(
          response,
          null,
          4
        )}`
      );
    }
  };

  private request(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      if (this.webSocket.readyState !== this.webSocket.OPEN) {
        return reject("WebSocket not open");
      }

      this.webSocket.send(encodeMessage(request));
      this.requests.set(request.id, { resolve, reject });
    });
  }

  async announce(agent: Agent) {
    const request: Request = {
      id: this.requestIndex,
      type: RequestType.Announce,
      data: agent,
    };
    this.requestIndex++;
    const response = await this.request(request);
    if (response.type === ResponseType.Announce && response.data === null) {
      return Promise.resolve(response.data);
    } else {
      return Promise.reject(
        `Received unexpected response: ${JSON.stringify(response, null, 4)}`
      );
    }
  }

  async getAllAgents() {
    const request: Request = {
      id: this.requestIndex,
      type: RequestType.GetAllAgents,
      data: undefined,
    };
    this.requestIndex++;
    const response = await this.request(request);
    if (
      response.type === ResponseType.GetAllAgents &&
      Array.isArray(response.data)
    ) {
      return Promise.resolve(response.data);
    } else {
      return Promise.reject("Received unexpected response");
    }
  }

  async close() {
    return new Promise<void>((resolve) => {
      this.webSocket.addEventListener(
        "close",
        (event) => {
          console.log("Signaling client closed:", event.code, event.reason);
          resolve();
        },
        { once: true }
      );
      this.webSocket.close();
    });
  }
}
