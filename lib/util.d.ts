import { RawData } from "ws";
import { Request, Response } from "./types";
export declare const encodeMessage: (message: Request | Response) => string;
export declare const decodeMessage: (response: RawData) => any;
