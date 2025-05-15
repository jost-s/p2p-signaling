import { RtcOffer } from "./types-signaling.js";

export type AgentId = string;

export interface Agent {
  id: AgentId;
}

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
  SendOffer = "request_send_offer",
}

export interface RequestAnnounce {
  type: RequestType.Announce;
  data: Agent;
}

export interface RequestGetAllAgents {
  type: RequestType.GetAllAgents;
  data: null;
}

export interface RequestSendOffer {
  type: RequestType.SendOffer;
  data: RtcOffer;
}

export type Request = RequestAnnounce | RequestGetAllAgents | RequestSendOffer;

export interface RequestMessage {
  id: number;
  request: Request;
}

export enum ResponseType {
  Announce = "response_announce",
  GetAllAgents = "response_get_all_agents",
  SendOffer = "response_send_offer",
  Error = "response_error",
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

export interface ResponseError {
  type: ResponseType.Error;
  data: string;
}

export type Response =
  | ResponseAnnounce
  | ResponseGetAllAgents
  | ResponseSendOffer
  | ResponseError;

export interface ResponseMessage {
  id: number;
  response: Response;
}
