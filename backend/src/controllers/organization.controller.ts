import { Response } from "express";
import { Organization } from "../models/Organization.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const getOrganization = async (
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

    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
