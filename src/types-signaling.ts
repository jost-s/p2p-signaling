import { AgentId } from "./types.js";

export interface RtcOffer {
  sender: AgentId;
  receiver: AgentId;
  offer: RTCSessionDescriptionInit;
}

export enum SignalingMessageType {
  Offer = "signaling_offer",
}

export type Signaling = RtcOffer;

export interface SignalingMessage {
  type: SignalingMessageType;
  signaling: Signaling;
}
