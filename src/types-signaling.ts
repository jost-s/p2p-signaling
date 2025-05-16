import { AgentId } from "./types.js";

export interface RtcOffer {
  sender: AgentId;
  receiver: AgentId;
  offer: RTCSessionDescriptionInit;
}

export interface RtcAnswer {
  sender: AgentId;
  receiver: AgentId;
  answer: RTCSessionDescriptionInit;
}

export enum SignalingType {
  Offer = "signaling_offer",
  Answer = "signaling_answer",
}

export interface SignalingOffer {
  type: SignalingType.Offer;
  data: RtcOffer;
}

export interface SignalingAnswer {
  type: SignalingType.Answer;
  data: RtcAnswer;
}

export type SignalingMessage = SignalingOffer | SignalingAnswer;
