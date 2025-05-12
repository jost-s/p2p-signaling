import { RequestType, ResponseType, } from "./types.js";
import { decodeMessage, encodeMessage } from "./util.js";
export class SignalingClient {
    constructor(ws) {
        this.webSocket = ws;
    }
    static async connect(url) {
        return new Promise((resolve, reject) => {
            const webSocket = new WebSocket(url);
            const connectionErrorHandler = (event) => {
                console.log("Error connecting signaling client:", event);
                reject(event);
            };
            webSocket.addEventListener("open", () => {
                webSocket.removeEventListener("error", connectionErrorHandler);
                console.log("Signaling client connected to", webSocket.url);
                const signalingClient = new SignalingClient(webSocket);
                resolve(signalingClient);
            }, { once: true });
            webSocket.addEventListener("error", connectionErrorHandler, {
                once: true,
            });
        });
    }
    request(request) {
        return new Promise((resolve, reject) => {
            if (this.webSocket.readyState !== this.webSocket.OPEN) {
                return reject("WebSocket not open");
            }
            const requestErrorHandler = (event) => {
                console.log("Error sending request:", event);
                reject(event);
            };
            this.webSocket.addEventListener("message", (event) => {
                this.webSocket.removeEventListener("error", requestErrorHandler);
                const response = decodeMessage(event.data);
                console.log("Incoming response", response);
                resolve(response);
            }, { once: true });
            this.webSocket.addEventListener("error", requestErrorHandler);
            this.webSocket.send(encodeMessage(request));
        });
    }
    async announce(agent) {
        const request = { type: RequestType.Announce, agent };
        const response = await this.request(request);
        if (response.type === ResponseType.Announce) {
            return Promise.resolve(response.result);
        }
        else {
            return Promise.reject(`Received unexpected response: ${JSON.stringify(response, null, 4)}`);
        }
    }
    async getAllAgents() {
        const request = { type: RequestType.GetAllAgents };
        const response = await this.request(request);
        if (response.type === ResponseType.GetAllAgents) {
            return Promise.resolve(response.agents);
        }
        else {
            return Promise.reject("Received unexpected response");
        }
    }
    async close() {
        return new Promise((resolve) => {
            this.webSocket.addEventListener("close", (event) => {
                console.log("Signaling client closed:", event.code, event.reason);
                resolve();
            }, { once: true });
            this.webSocket.close();
        });
    }
}
