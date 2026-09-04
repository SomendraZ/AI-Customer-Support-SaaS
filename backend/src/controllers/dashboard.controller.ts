import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Conversation } from "../models/Conversation.js";

export const getDashboardStats = async (
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

    const { organizationId } = req.user;

    const [
      conversationCount,
      resolvedConversationCount,
      aiResolvedCount,
      humanResolvedCount,
    ] = await Promise.all([
      Conversation.countDocuments({
        organizationId,
      }),

      Conversation.countDocuments({
        organizationId,
        resolution: {
          $in: ["ai_resolved", "human_resolved"],
        },
      }),

      Conversation.countDocuments({
        organizationId,
        resolution: "ai_resolved",
      }),

      Conversation.countDocuments({
        organizationId,
        resolution: "human_resolved",
      }),
    ]);

    const aiResolutionRate =
      resolvedConversationCount === 0
        ? 0
        : Number(
            ((aiResolvedCount / resolvedConversationCount) * 100).toFixed(2),
          );

    res.status(200).json({
      success: true,
      stats: {
        conversationCount,
        resolvedConversationCount,
        aiResolvedCount,
        humanResolvedCount,
        aiResolutionRate,
      },
    });
  } catch (error) {
    console.error("GET DASHBOARD STATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};
