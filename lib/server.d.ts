export declare class SignalingServer {
    private readonly wss;
    private agents;
    private constructor();
    private registerConnectionListener;
    static start(url: URL): Promise<SignalingServer>;
    close(): Promise<void>;
}
