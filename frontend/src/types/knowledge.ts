export type DocumentStatus = "processing" | "ready" | "failed";

export type DocumentType = "pdf" | "txt" | "docx";

export interface KnowledgeDocument {
  _id: string;
  name: string;
  originalName: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  organizationId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeResponse {
  success: boolean;
  count: number;
  documents: KnowledgeDocument[];
}
