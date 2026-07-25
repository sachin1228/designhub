import type { DEVELOPER_ROLES } from "./constants";

export type DeveloperRole = (typeof DEVELOPER_ROLES)[number];

export interface DeveloperProfile {
  id: string;
  fullName: string;
  role: DeveloperRole;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

/** @deprecated Use DeveloperProfile instead. */
export type DesignerProfile = DeveloperProfile;
