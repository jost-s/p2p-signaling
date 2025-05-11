var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SignalingServer_wss, _SignalingServer_agents;
import { WebSocketServer } from "ws";
import { RequestType, ResponseType } from "./types.js";
import { decodeMessage, encodeMessage } from "./util.js";
export class SignalingServer {
    constructor(wss) {
        _SignalingServer_wss.set(this, void 0);
        _SignalingServer_agents.set(this, void 0);
        __classPrivateFieldSet(this, _SignalingServer_wss, wss, "f");
        __classPrivateFieldSet(this, _SignalingServer_agents, new Map(), "f");
        this.registerConnectionListener();
    }
    registerConnectionListener() {
        __classPrivateFieldGet(this, _SignalingServer_wss, "f").on("connection", (socket, req) => {
            console.log("Incoming connection from", req.socket.remoteAddress);
            console.log("Connected clients:", __classPrivateFieldGet(this, _SignalingServer_wss, "f").clients?.size);
            socket.on("error", (error) => console.error(error));
            socket.on("message", (data) => {
                const request = decodeMessage(data);
                console.log("Incoming request", request);
                let response;
                if (request.type === RequestType.Announce) {
                    __classPrivateFieldGet(this, _SignalingServer_agents, "f").set(request.agent.id, socket);
                    response = encodeMessage({
                        type: ResponseType.Announce,
                        result: null,
                    });
                }
                else if (request.type === RequestType.GetAllAgents) {
                    const agents = Array.from(__classPrivateFieldGet(this, _SignalingServer_agents, "f").keys()).map((id) => ({ id }));
                    response = encodeMessage({
                        type: ResponseType.GetAllAgents,
                        agents,
                    });
                }
                else {
                    return;
                }
                socket.send(response);
            });
        });
    }
    static async start(url) {
        return new Promise((resolve, reject) => {
            const wss = new WebSocketServer({
                host: url.hostname,
                port: parseInt(url.port),
            });
            const signalingServer = new SignalingServer(wss);
            wss.once("listening", () => {
                console.log("Signaling server listening at", wss.address());
                resolve(signalingServer);
            });
            wss.on("error", (error) => {
                console.error(error);
                reject(error);
            });
            wss.once("close", () => {
                console.log("Signaling server closed.");
            });
        });
    }
    close() {
        __classPrivateFieldGet(this, _SignalingServer_wss, "f").close();
    }
}
_SignalingServer_wss = new WeakMap(), _SignalingServer_agents = new WeakMap();
