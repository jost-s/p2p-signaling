export type AgentId = string;

export interface Agent {
  id: AgentId;
}

export enum RequestType {
  Announce = "request_announce",
  GetAllAgents = "request_get_all_agents",
}

export interface RequestAnnounce {
  type: RequestType.Announce;
  data: Agent;
}

export interface RequestGetAllAgents {
  type: RequestType.GetAllAgents;
  data: null;
}

export type Request = RequestAnnounce | RequestGetAllAgents;

export interface RequestMessage {
  id: number;
  request: Request;
}

export enum ResponseType {
  Announce = "response_announce",
  GetAllAgents = "response_get_all_agents",
}

export interface ResponseAnnounce {
  type: ResponseType.Announce;
  data: null;
}

export interface ResponseGetAllAgents {
  type: ResponseType.GetAllAgents;
  data: Agent[];
}

export type Response = ResponseAnnounce | ResponseGetAllAgents;

export interface ResponseMessage {
  id: number;
  response: Response;
}
