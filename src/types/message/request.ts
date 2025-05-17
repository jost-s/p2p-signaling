import { Agent } from "../agent.js";
import { MessageType } from "./index.js";
import { SignalingAnswer, SignalingOffer } from "./signaling.js";

export interface RequestMessage {
  type: MessageType.Request;
  id: number;
  request: Request;
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

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
  SendOffer = "request_send_offer",
  SendAnswer = "request_send_answer",
}

export type Request =
  | RequestAnnounce
  | RequestGetAllAgents
  | RequestSendOffer
  | RequestSendAnswer;
