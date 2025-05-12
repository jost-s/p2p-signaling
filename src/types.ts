export type AgentId = string;

export interface Agent {
  id: AgentId;
}

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
}

export type RequestAnnounce = Agent;

export type RequestGetAllAgents = void;

export interface Request {
  id: number;
  type: RequestType;
  data: RequestAnnounce | RequestGetAllAgents;
}

export enum ResponseType {
  Announce = "response_announce",
  GetAllAgents = "response_get_all_agents",
}

export type ResponseAnnounce = null | Error;

export type ResponseGetAllAgents = Agent[];

export interface Response {
  id: number;
  type: ResponseType;
  data: ResponseAnnounce | ResponseGetAllAgents;
}
