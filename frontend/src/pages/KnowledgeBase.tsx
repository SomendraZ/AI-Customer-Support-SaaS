import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import type { KnowledgeDocument, KnowledgeResponse } from "../types/knowledge";

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<KnowledgeResponse>("/knowledge");

      setDocuments(response.data.documents);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to load knowledge documents",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("document", file);

      await api.post("/knowledge/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchDocuments();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?",
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/knowledge/${id}`);

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document._id !== id),
      );
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string) => {
    if (type === "pdf") return "📕";
    if (type === "docx") return "📘";
    return "📄";
  };

  return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Knowledge Base</h1>

          <p>
            Upload documents that your AI agents can use as a knowledge source.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleUpload}
            hidden
          />

          <button
            type="button"
            className="primary-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "+ Upload Document"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="knowledge-summary">
        <div className="knowledge-stat">
          <span>Total Documents</span>
          <strong>{loading ? "—" : documents.length}</strong>
        </div>

        <div className="knowledge-stat">
          <span>Ready</span>
          <strong>
            {loading
              ? "—"
              : documents.filter((document) => document.status === "ready")
                  .length}
          </strong>
        </div>
      </div>

      <div className="documents-section">
        <div className="section-header">
          <h2>Documents</h2>
        </div>

        {loading ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>

            <h3>No documents yet</h3>

            <p>Upload a PDF, TXT, or DOCX file to build your knowledge base.</p>

            <button
              type="button"
              className="primary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="document-list">
            {documents.map((document) => (
              <div className="document-card" key={document._id}>
                <div className="document-icon">
                  {getDocumentIcon(document.type)}
                </div>

                <div className="document-info">
                  <h3>{document.name}</h3>

                  <p>{document.originalName}</p>

                  <div className="document-meta">
                    <span>{formatFileSize(document.size)}</span>

                    <span>•</span>

                    <span>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="document-actions">
                  <span className={`status-badge ${document.status}`}>
                    {document.status}
                  </span>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(document._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
