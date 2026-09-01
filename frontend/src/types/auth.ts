export type UserRole = "owner" | "admin" | "agent" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface Organization {
  _id: string;
  name: string;
  plan: "free" | "pro" | "business";
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
