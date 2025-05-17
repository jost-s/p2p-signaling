import {
  Signaling,
  SignalingMessage,
  SignalingType,
  Agent,
  AgentId,
  Request,
  RequestMessage,
  RequestType,
  Response,
  ResponseMessage,
  ResponseType,
  MessageType,
} from "./types/index.js";
import { decodeMessage, encodeRequestMessage, formatError } from "./util.js";

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
    let responseMessage: ResponseMessage;
    try {
      responseMessage = decodeResponseMessage(event.data);
    } catch (error) {
      console.error(error);
      return;
    }

    const message = decodeMessage(event.data);

    if (message.type === MessageType.Response) {
      console.log("Incoming response", message);
      const pendingRequest = this.requests.get(message.id);
    if (pendingRequest) {
        pendingRequest.resolve(message.response);
        this.requests.delete(message.id);
    } else {
      console.error(
          `Received response to an unknown request: ${formatError(message)}`
      );
      }
    } else {
    }
  };

  private request(request: RequestMessage) {
    return new Promise<Response>((resolve, reject) => {
      if (this.webSocket.readyState !== this.webSocket.OPEN) {
        return reject("WebSocket not open");
      }

      this.webSocket.send(encodeRequestMessage(request));
      this.requests.set(request.id, { resolve, reject });
    });
  }

  async announce(agent: Agent) {
    const request: Request = {
        type: RequestType.Announce,
        data: agent,
    };
    const response = await this.request(request);
    if (response.type === ResponseType.Announce && response.data === null) {
      return Promise.resolve(response.data);
    } else {
      return Promise.reject(
        `Received unexpected response: ${formatError(response)}`
      );
    }
  }

  async getAllAgents() {
    const request: Request = {
        type: RequestType.GetAllAgents,
        data: null,
    };
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
