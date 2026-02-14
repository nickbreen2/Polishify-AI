export type PolishMode = "general" | "prompt";

export interface PolishRequest {
  type: "POLISH_REQUEST";
  text: string;
  mode: PolishMode;
}

export interface PolishResponse {
  type: "POLISH_RESPONSE";
  improvedText: string;
}

export interface PolishError {
  type: "POLISH_ERROR";
  error: string;
}

export interface TriggerPolish {
  type: "TRIGGER_POLISH";
}

export interface ClarifyingQuestion {
  question: string;
  options: string[];
  allowOther: boolean;
}

export interface ClarifyRequest {
  type: "CLARIFY_REQUEST";
  text: string;
  polishedText?: string;
}

export interface ClarifyResponse {
  type: "CLARIFY_RESPONSE";
  questions: ClarifyingQuestion[];
}

export interface ClarifyError {
  type: "CLARIFY_ERROR";
  error: string;
}

export interface ImproveRequest {
  type: "IMPROVE_REQUEST";
  text: string;
  mode: PolishMode;
  polishedText?: string;
  answers: string[];
}

export interface ImproveResponse {
  type: "IMPROVE_RESPONSE";
  improvedText: string;
}

export interface ImproveError {
  type: "IMPROVE_ERROR";
  error: string;
}

export type ExtensionMessage =
  | PolishRequest
  | PolishResponse
  | PolishError
  | TriggerPolish
  | ClarifyRequest
  | ClarifyResponse
  | ClarifyError
  | ImproveRequest
  | ImproveResponse
  | ImproveError;
