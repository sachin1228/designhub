import type { DESIGNER_ROLES } from "./constants";

export type DesignerRole = (typeof DESIGNER_ROLES)[number];

export interface DesignerProfile {
  id: string;
  fullName: string;
  role: DesignerRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}
