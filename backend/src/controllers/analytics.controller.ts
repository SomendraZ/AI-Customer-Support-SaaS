import { Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Conversation } from "../models/Conversation.js";

export const getConversationAnalytics = async (
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

    if (!Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
      return;
    }

    const organizationObjectId = new Types.ObjectId(organizationId);

    const analytics = await Conversation.aggregate([
      {
        $match: {
          organizationId: organizationObjectId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          conversations: {
            $sum: 1,
          },
          aiResolved: {
            $sum: {
              $cond: [{ $eq: ["$resolution", "ai_resolved"] }, 1, 0],
            },
          },
          humanResolved: {
            $sum: {
              $cond: [{ $eq: ["$resolution", "human_resolved"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          conversations: 1,
          aiResolved: 1,
          humanResolved: 1,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("GET CONVERSATION ANALYTICS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load conversation analytics",
    });
  }
};

export const getResolutionAnalytics = async (
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

    if (!Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
      return;
    }

    const organizationObjectId = new Types.ObjectId(organizationId);

    const analytics = await Conversation.aggregate([
      {
        $match: {
          organizationId: organizationObjectId,
        },
      },
      {
        $group: {
          _id: "$resolution",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const result = {
      total: 0,
      unresolved: 0,
      aiResolved: 0,
      humanResolved: 0,
    };

    for (const item of analytics) {
      result.total += item.count;

      if (item._id === "unresolved") {
        result.unresolved = item.count;
      }

      if (item._id === "ai_resolved") {
        result.aiResolved = item.count;
      }

      if (item._id === "human_resolved") {
        result.humanResolved = item.count;
      }
    }

    res.status(200).json({
      success: true,
      analytics: result,
    });
  } catch (error) {
    console.error("GET RESOLUTION ANALYTICS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load resolution analytics",
    });
  }
};

export const getAgentAnalytics = async (
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

    if (!Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
      return;
    }

    const organizationObjectId = new Types.ObjectId(organizationId);

    const analytics = await Conversation.aggregate([
      {
        $match: {
          organizationId: organizationObjectId,
        },
      },
      {
        $group: {
          _id: "$agentId",
          total: {
            $sum: 1,
          },
          aiResolved: {
            $sum: {
              $cond: [
                {
                  $eq: ["$resolution", "ai_resolved"],
                },
                1,
                0,
              ],
            },
          },
          humanResolved: {
            $sum: {
              $cond: [
                {
                  $eq: ["$resolution", "human_resolved"],
                },
                1,
                0,
              ],
            },
          },
          unresolved: {
            $sum: {
              $cond: [
                {
                  $eq: ["$resolution", "unresolved"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      {
        $unwind: "$agent",
      },
      {
        $project: {
          _id: 0,
          agentId: "$_id",
          agentName: "$agent.name",
          total: 1,
          aiResolved: 1,
          humanResolved: 1,
          unresolved: 1,
          aiResolutionRate: {
            $cond: [
              {
                $eq: [
                  {
                    $add: ["$aiResolved", "$humanResolved"],
                  },
                  0,
                ],
              },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      "$aiResolved",
                      {
                        $add: ["$aiResolved", "$humanResolved"],
                      },
                    ],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
      {
        $sort: {
          aiResolutionRate: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("GET AGENT ANALYTICS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load agent analytics",
    });
  }
};
