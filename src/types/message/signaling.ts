import { AgentId } from "../agent.js";
import { MessageType } from "./index.js";

export interface SignalingMessage {
  type: MessageType.Signaling;
  signaling: Signaling;
}

export type Signaling = SignalingOffer | SignalingAnswer;

export interface SignalingOffer {
  type: SignalingType.Offer;
  data: RtcOffer;
}

export interface SignalingAnswer {
  type: SignalingType.Answer;
  data: RtcAnswer;
}

export enum SignalingType {
  Offer = "signaling_offer",
  Answer = "signaling_answer",
}

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
