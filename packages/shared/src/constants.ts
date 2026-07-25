export const APP_NAME = "drafthub";
export const APP_TAGLINE = "Where developers connect, build, and grow.";

export const DEVELOPER_ROLES = ["frontend", "backend", "full_stack", "mobile", "devops", "data", "other"] as const;

/** @deprecated Use DEVELOPER_ROLES instead. Kept for consumers that still import the old name. */
export const DESIGNER_ROLES = DEVELOPER_ROLES;
