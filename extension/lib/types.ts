export type PolishMode = "prompt" | "professional" | "creative" | "casual";

export type OutputStyle = "Detailed" | "Concise" | "Structured" | "Creative";

export type GradeTier = "Excellent" | "Good" | "Needs Work";

export interface GradeResult {
  overall: GradeTier;
  dimensions: Record<string, GradeTier>;
  feedback: string[];
}

export interface PolishRequest {
  type: "POLISH_REQUEST";
  text: string;
  mode?: PolishMode;
  style?: OutputStyle;
}

export interface PolishResponse {
  type: "POLISH_RESPONSE";
  improvedText: string;
  detectedMode: PolishMode;
  grade: GradeResult;
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
  detectedMode?: PolishMode;
  grade?: GradeResult;
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
  grade?: GradeResult;
}

export interface ImproveResponse {
  type: "IMPROVE_RESPONSE";
  improvedText: string;
  grade: GradeResult;
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
