import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });

      return;
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User already exists",
      });

      return;
    }

    const organization = await Organization.create({
      name: organizationName,
    });

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "owner",
      organizationId: organization._id,
    });

    const token = generateToken({
      userId: user._id.toString(),
      organizationId: organization._id.toString(),
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
