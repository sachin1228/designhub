// Shared constants — ported from @draft/shared
export const APP_NAME = "draft";
export const APP_TAGLINE = "Where design work finds its audience.";

export const DESIGNER_ROLES = ["ui_ux", "product", "social_media", "other"] as const;
export type DesignerRole = (typeof DESIGNER_ROLES)[number];

export interface DesignerProfile {
  id: string;
  fullName: string;
  role: DesignerRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}
