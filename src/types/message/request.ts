import { Agent } from "../agent.js";
import { MessageType } from "./index.js";
import {
  SignalingAnswer,
  SignalingIceCandidate,
  SignalingOffer,
} from "./signaling.js";

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

export interface RequestSendIceCandidate {
  type: RequestType.SendIceCandidate;
  data: SignalingIceCandidate;
}

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
  SendOffer = "request_send_offer",
  SendAnswer = "request_send_answer",
  SendIceCandidate = "request_send_ice_candidate",
}

export type Request =
  | RequestAnnounce
  | RequestGetAllAgents
  | RequestSendOffer
  | RequestSendAnswer
  | RequestSendIceCandidate;
