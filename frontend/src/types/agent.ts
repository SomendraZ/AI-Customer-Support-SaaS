export type AgentStatus = "active" | "inactive";

export type AgentTone = "professional" | "friendly" | "casual" | "formal";

export interface Agent {
  _id: string;
  name: string;
  description?: string;
  instructions: string;
  tone: AgentTone;
  modelName: string;
  temperature: number;
  status: AgentStatus;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
