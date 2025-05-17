import { RequestMessage } from "./index.js";
import { SignalingMessage } from "./index.js";
import { ResponseMessage } from "./response.js";

export * from "./request.js";
export * from "./response.js";
export * from "./signaling.js";

export type Message = RequestMessage | ResponseMessage | SignalingMessage;

export enum MessageType {
  Request = "request",
  Response = "response",
  Signaling = "signaling",
}
