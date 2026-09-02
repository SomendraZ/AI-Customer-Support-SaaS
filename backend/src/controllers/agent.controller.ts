import { Response } from "express";

import { Agent } from "../models/Agent.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const createAgent = async (
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

    const { name, description, instructions, tone, modelName, temperature } =
      req.body;

    if (!name || !instructions) {
      res.status(400).json({
        success: false,
        message: "Name and instructions are required",
      });

      return;
    }

    const agent = await Agent.create({
      name,
      description,
      instructions,
      tone,
      modelName: modelName || "default",
      temperature: temperature !== undefined ? temperature : 0.3,
      status: "active",
      organizationId: req.user.organizationId,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      agent,
    });
  } catch (error) {
    console.error("Create agent error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAgents = async (
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

    const agents = await Agent.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    console.error("Get agents error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAgent = async (
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

    const agent = await Agent.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: "Agent not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error("Get agent error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateAgent = async (
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

    const {
      name,
      description,
      instructions,
      tone,
      modelName,
      temperature,
      status,
    } = req.body;

    const agent = await Agent.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(instructions !== undefined && { instructions }),
          ...(tone !== undefined && { tone }),
          ...(modelName !== undefined && { modelName }),
          ...(temperature !== undefined && { temperature }),
          ...(status !== undefined && { status }),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!agent) {
      res.status(404).json({
        success: false,
        message: "Agent not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Agent updated successfully",
      agent,
    });
  } catch (error) {
    console.error("Update agent error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteAgent = async (
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

    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: "Agent not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete agent error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
