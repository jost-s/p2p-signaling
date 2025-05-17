import { Agent } from "../agent.js";
import { MessageType } from "./index.js";

export interface ResponseMessage {
  type: MessageType.Response;
  id: number;
  response: Response;
}

export interface ResponseAnnounce {
  type: ResponseType.Announce;
  data: null;
}

export interface ResponseGetAllAgents {
  type: ResponseType.GetAllAgents;
  data: Agent[];
}

export interface ResponseSendOffer {
  type: ResponseType.SendOffer;
  data: null;
}

export interface ResponseSendAnswer {
  type: ResponseType.SendAnswer;
  data: null;
}

export interface ResponseError {
  type: ResponseType.Error;
  data: string;
}

export enum ResponseType {
  Announce = "response_announce",
  GetAllAgents = "response_get_all_agents",
  SendOffer = "response_send_offer",
  SendAnswer = "response_send_answer",
  Error = "response_error",
}

export type Response =
  | ResponseAnnounce
  | ResponseGetAllAgents
  | ResponseSendOffer
  | ResponseSendAnswer
  | ResponseError;
