import { requestType, responseType } from "./util";

export type AgentId = string;

export interface Agent {
  id: AgentId;
}

export interface RequestAnnounce {
  type: typeof requestType.announce;
  agent: Agent;
}

export interface RequestGetAllAgents {
  type: typeof requestType.getAllAgents;
}

export interface ResponseAnnounce {
  type: typeof responseType.announce;
  result: null | Error;
}

export interface ResponseGetAllAgents {
  type: typeof responseType.getAllAgents;
  agents: Agent[];
}

export type Request = RequestAnnounce | RequestGetAllAgents;

export type Response = ResponseAnnounce | ResponseGetAllAgents;
