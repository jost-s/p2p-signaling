import { RawData } from "ws";
import { RequestMessage, ResponseMessage } from "./types.js";
import { SignalingMessage } from "./types-signaling.js";

export const encodeRequestMessage = (message: RequestMessage) =>
  JSON.stringify(message);

export const encodeResponseMessage = (message: ResponseMessage) =>
  JSON.stringify(message);

export const encodeSignalingMessage = (message: SignalingMessage) =>
  JSON.stringify(message);

export const decodeRequestMessage = (message: RawData) => {
  const requestMessage: RequestMessage = JSON.parse(message.toString());
  if (
    typeof requestMessage === "object" &&
    requestMessage !== null &&
    "id" in requestMessage &&
    "request" in requestMessage &&
    typeof requestMessage.request === "object" &&
    requestMessage.request !== null &&
    "type" in requestMessage.request &&
    "data" in requestMessage.request
  ) {
    return requestMessage;
  }
  throw new Error(
    `Unknown request format: ${JSON.stringify(requestMessage, null, 4)}`
  );
};

export const decodeResponseMessage = (message: RawData) => {
  const responseMessage: ResponseMessage = JSON.parse(message.toString());
  if (
    typeof responseMessage === "object" &&
    responseMessage !== null &&
    "id" in responseMessage &&
    "response" in responseMessage &&
    typeof responseMessage.response === "object" &&
    responseMessage.response !== null &&
    "type" in responseMessage.response &&
    "data" in responseMessage.response
  ) {
    return responseMessage;
  }
  throw new Error(
    `Unknown response format: ${JSON.stringify(responseMessage, null, 4)}`
  );
};

export const decodeSignalingMessage = (message: RawData) => {
  const signalingMessage: SignalingMessage = JSON.parse(message.toString());
  if (
    typeof signalingMessage === "object" &&
    signalingMessage !== null &&
    "signaling" in signalingMessage &&
    typeof signalingMessage.signaling === "object" &&
    signalingMessage.signaling !== null
  ) {
    return signalingMessage;
  }
  throw new Error(
    `Unknown signaling format: ${JSON.stringify(signalingMessage, null, 4)}`
  );
};

export const encodeError = (error: Error) => JSON.stringify(error.message);
export const decodeError = (error: string) => new Error(JSON.parse(error));
