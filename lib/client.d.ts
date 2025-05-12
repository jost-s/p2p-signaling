import { Agent } from "./types.js";
export declare class SignalingClient {
    private readonly webSocket;
    private constructor();
    static connect(url: URL): Promise<SignalingClient>;
    private request;
    announce(agent: Agent): Promise<Error | null>;
    getAllAgents(): Promise<Agent[]>;
    close(): Promise<void>;
}
