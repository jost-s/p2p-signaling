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
  Message,
} from "./types/index.js";
import { decodeMessage, encodeRequestMessage, formatError } from "./util.js";

type RequestResolveFn = (value: Response) => void;
type RequestRejectFn = (reason?: any) => void;
type SignalingListener = (message: SignalingMessage) => void;

export class SignalingClient {
  readonly agent: Agent;

  private readonly webSocket: WebSocket;
  private requestIndex: number;
  private readonly requests: Map<
    number,
    { resolve: RequestResolveFn; reject: RequestRejectFn }
  >;
  private readonly signalingListeners: Map<SignalingType, SignalingListener>;

  private constructor(ws: WebSocket, agent: Agent) {
    this.webSocket = ws;
    this.webSocket.addEventListener("message", this.messageListener);
    this.agent = agent;
    this.requestIndex = 0;
    this.requests = new Map();
    this.signalingListeners = new Map();
  }

  static async connect(url: URL, agent: Agent) {
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
          const signalingClient = new SignalingClient(webSocket, agent);
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
    let message: Message;
    try {
      message = decodeMessage(event.data);
    } catch (error) {
      console.error(error);
      return;
    }

    if (message.type === MessageType.Response) {
      console.log("Incoming response", message);
      this.handleResponse(message);
    } else if (message.type === MessageType.Signaling) {
      console.log("Incoming signaling", message);
      this.handleSignaling(message);
    } else {
      console.error(
        "Incoming message of unknown format:",
        formatError(message)
      );
    }
  };

  private handleResponse(message: ResponseMessage) {
    const pendingRequest = this.requests.get(message.id);
    if (pendingRequest) {
      pendingRequest.resolve(message.response);
      this.requests.delete(message.id);
    } else {
      console.error(
        `Received response to an unknown request: ${formatError(message)}`
      );
    }
  }

  private handleSignaling(message: SignalingMessage) {
    const signalingListener = this.signalingListeners.get(
      message.signaling.type
    );
    if (signalingListener) {
      signalingListener(message);
    }
  }

  private request(request: Request) {
    const requestMessage: RequestMessage = {
      type: MessageType.Request,
      id: this.requestIndex,
      request,
    };
    return new Promise<Response>((resolve, reject) => {
      if (this.webSocket.readyState !== this.webSocket.OPEN) {
        return reject("WebSocket not open");
      }

      this.webSocket.send(encodeRequestMessage(requestMessage));
      this.requests.set(this.requestIndex, { resolve, reject });
      this.requestIndex++;
    });
  }

  async announce() {
    const request: Request = {
      type: RequestType.Announce,
      data: this.agent,
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

  addSignalingListener(type: SignalingType, listener: SignalingListener) {
    this.signalingListeners.set(type, listener);
  }

  async sendOffer(receiver: AgentId, offer: RTCSessionDescriptionInit) {
    const request: Request = {
      type: RequestType.SendOffer,
      data: {
        type: SignalingType.Offer,
        data: {
          sender: this.agent.id,
          receiver,
          offer,
        },
      },
    };
    const response = await this.request(request);
    if (response.type === ResponseType.SendOffer && response.data === null) {
      return Promise.resolve(response.data);
    } else {
      return Promise.reject("Received unexpected response");
    }
  }

  async sendAnswer(receiver: AgentId, answer: RTCSessionDescriptionInit) {
    const request: Request = {
      type: RequestType.SendAnswer,
      data: {
        type: SignalingType.Answer,
        data: {
          sender: this.agent.id,
          receiver,
          answer,
        },
      },
    };
    const response = await this.request(request);
    if (response.type === ResponseType.SendAnswer && response.data === null) {
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
