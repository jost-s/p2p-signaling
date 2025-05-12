export type AgentId = string;
export interface Agent {
    id: AgentId;
}
export declare enum RequestType {
    Announce = "request_announce",
    GetAllAgents = "request_get_all_agents"
}
export declare enum ResponseType {
    Announce = "response_announce",
    GetAllAgents = "response_get_all_agents"
}
export interface RequestAnnounce {
    type: RequestType.Announce;
    agent: Agent;
}
export interface RequestGetAllAgents {
    type: RequestType.GetAllAgents;
}
export interface ResponseAnnounce {
    type: ResponseType.Announce;
    result: null | Error;
}
export interface ResponseGetAllAgents {
    type: ResponseType.GetAllAgents;
    agents: Agent[];
}
export type Request = RequestAnnounce | RequestGetAllAgents;
export type Response = ResponseAnnounce | ResponseGetAllAgents;
