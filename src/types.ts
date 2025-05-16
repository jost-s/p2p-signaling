import {
  RtcAnswer,
  RtcOffer,
  SignalingAnswer,
  SignalingMessage,
  SignalingOffer,
} from "./types-signaling.js";

export type AgentId = string;

export interface Agent {
  id: AgentId;
}

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
  SendOffer = "request_send_offer",
  SendAnswer = "request_send_answer",
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
  data: SignalingOffer;
}

export interface RequestSendAnswer {
  type: RequestType.SendAnswer;
  data: SignalingAnswer;
}

export type Request =
  | RequestAnnounce
  | RequestGetAllAgents
  | RequestSendOffer
  | RequestSendAnswer;

export interface RequestMessage {
  id: number;
  request: Request;
}

export enum ResponseType {
  Announce = "response_announce",
  GetAllAgents = "response_get_all_agents",
  SendOffer = "response_send_offer",
  SendAnswer = "response_send_answer",
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

export interface ResponseSendAnswer {
  type: ResponseType.SendAnswer;
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
  | ResponseSendAnswer
  | ResponseError;

export interface ResponseMessage {
  id: number;
  response: Response;
}
