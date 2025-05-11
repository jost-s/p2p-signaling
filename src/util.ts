import { RawData } from "ws";
import { Request, Response } from "./types";

export const encodeMessage = (message: Request | Response) =>
  JSON.stringify(message);

export const decodeMessage = (response: RawData) =>
  JSON.parse(response.toString());
