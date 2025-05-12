import { RawData } from "ws";
import { Request, Response } from "./types";

export const encodeMessage = (message: Request | Response) =>
  JSON.stringify(message);

export const decodeMessage = (message: RawData) =>
  JSON.parse(message.toString());

export const assertIsRequest: (
  request: unknown
) => asserts request is Request = (request) => {
  if (
    typeof request === "object" &&
    request !== null &&
    "id" in request &&
    "type" in request
  ) {
    return;
  }
  throw new Error(`Unexpected request: ${JSON.stringify(request, null, 4)}`);
};

export const assertIsResponse: (
  response: unknown
) => asserts response is Response = (response) => {
  if (
    typeof response === "object" &&
    response !== null &&
    "type" in response &&
    "id" in response &&
    "data" in response
  ) {
    return;
  }
  throw new Error(`Unexpected response: ${JSON.stringify(response, null, 4)}`);
};
