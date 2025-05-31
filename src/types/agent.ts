export type AgentId = string;

export interface Agent {
  id: AgentId;
  name: string;
  expiry: number;
}
