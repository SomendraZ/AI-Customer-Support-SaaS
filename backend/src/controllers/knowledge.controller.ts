import { Response } from "express";

import { KnowledgeDocument } from "../models/KnowledgeDocument.js";

import { extractText } from "../services/document.service.js";

import { AuthRequest } from "../middleware/auth.middleware.js";

import { DocumentChunk } from "../models/DocumentChunk.js";

import { chunkText } from "../services/chunk.service.js";

import { generateEmbedding } from "../services/embedding.service.js";

import { searchKnowledgeBase } from "../services/search.service.js";

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No document uploaded",
      });
      return;
    }

    const file = req.file;
    const text = await extractText(file);

    if (!text.trim()) {
      throw new Error("No text could be extracted from document");
    }

    if (!text) {
      res.status(400).json({
        success: false,
        message: "Could not extract text from document",
      });
      return;
    }

    const extension = file.originalname.split(".").pop()?.toLowerCase();

    if (extension !== "pdf" && extension !== "txt" && extension !== "docx") {
      res.status(400).json({
        success: false,
        message: "Unsupported document format",
      });
      return;
    }

    const document = await KnowledgeDocument.create({
      name: file.originalname,
      originalName: file.originalname,
      type: extension,
      mimeType: file.mimetype,
      size: file.size,
      text,
      status: "ready",
      organizationId: req.user.organizationId,
      uploadedBy: req.user.userId,
    });

    const chunks = chunkText(text);

    const chunkDocuments = [];

    for (let index = 0; index < chunks.length; index++) {
      const content = chunks[index];

      const embedding = await generateEmbedding(content);

      chunkDocuments.push({
        documentId: document._id,
        organizationId: req.user!.organizationId,
        content,
        chunkIndex: index,
        embedding,
      });
    }

    await DocumentChunk.insertMany(chunkDocuments);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        _id: document._id,
        name: document.name,
        originalName: document.originalName,
        type: document.type,
        size: document.size,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("DOCUMENT PROCESSING ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process document",
    });
  }
};

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const documents = await KnowledgeDocument.find({
      organizationId: req.user.organizationId,
    })
      .select("-text")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getDocument = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const document = await KnowledgeDocument.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    }).select("-text");

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Get document error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const document = await KnowledgeDocument.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    await DocumentChunk.deleteMany({
      documentId: document._id,
      organizationId: req.user!.organizationId,
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { query, limit } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await searchKnowledgeBase(
      req.user.organizationId,
      query,
      limit || 5,
    );

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("KNOWLEDGE SEARCH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search knowledge base",
    });
  }
};
