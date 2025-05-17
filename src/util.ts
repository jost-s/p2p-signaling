import { RawData } from "ws";
import { Message, RequestMessage, ResponseMessage } from "./types/index.js";
import { SignalingMessage } from "./types/message/signaling.js";

export const encodeRequestMessage = (message: RequestMessage) =>
  JSON.stringify(message);

export const encodeResponseMessage = (message: ResponseMessage) =>
  JSON.stringify(message);

export const encodeSignalingMessage = (message: SignalingMessage) =>
  JSON.stringify(message);

export const decodeMessage = (message: RawData) => {
  const decodedMessage: Message = JSON.parse(message.toString());
  if (
    typeof decodedMessage === "object" &&
    decodedMessage !== null &&
    "type" in decodedMessage
  ) {
    return decodedMessage;
  }
  throw new Error(`Unknown message format: ${formatError(decodedMessage)}`);
};

export const formatError = (object: object) => JSON.stringify(object, null, 2);
