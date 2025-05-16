import { RawData } from "ws";
import {
  RequestMessage,
  RequestType,
  ResponseMessage,
  ResponseType,
} from "./types.js";
import { SignalingMessage, SignalingType } from "./types-signaling.js";

export const encodeRequestMessage = (message: RequestMessage) =>
  JSON.stringify(message);

export const encodeResponseMessage = (message: ResponseMessage) =>
  JSON.stringify(message);

export const encodeSignalingMessage = (message: SignalingMessage) =>
  JSON.stringify(message);

export const decodeMessage = (message: RawData) => {
  const decodedMessage = JSON.parse(message.toString());
  if (
    typeof decodedMessage === "object" &&
    decodedMessage !== null &&
    "type" in decodedMessage &&
    Object.values(SignalingType).some((type) => decodedMessage.type === type) &&
    "data" in decodeMessage
  ) {
    return decodedMessage;
  }
  throw new Error(`Unknown message format: ${formatError(decodeMessage)}`);
};

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
    Object.values(RequestType).some(
      (type) => requestMessage.request.type === type
    ) &&
    "data" in requestMessage.request
  ) {
    return requestMessage;
  }
  throw new Error(`Unknown request format: ${formatError(requestMessage)}`);
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
    Object.values(ResponseType).some(
      (type) => responseMessage.response.type === type
    ) &&
    "data" in responseMessage.response
  ) {
    return responseMessage;
  }
  throw new Error(`Unknown response format: ${formatError(responseMessage)}`);
};

export const decodeSignalingMessage = (message: RawData) => {
  const signalingMessage: SignalingMessage = JSON.parse(message.toString());
  if (
    typeof signalingMessage === "object" &&
    signalingMessage !== null &&
    "type" in signalingMessage &&
    Object.values(SignalingType).some(
      (type) => signalingMessage.type === type
    ) &&
    "data" in signalingMessage
  ) {
    return signalingMessage;
  }
  throw new Error(`Unknown signaling format: ${formatError(signalingMessage)}`);
};

export const formatError = (object: object) => JSON.stringify(object, null, 2);
