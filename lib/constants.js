/**
 * Shared Application Constants
 */

export const CONTRIBUTION_CATEGORIES = [
  { name: "Code", variant: "indigo" },
  { name: "Research", variant: "blue" },
  { name: "Design", variant: "purple" },
  { name: "Documentation", variant: "yellow" },
  { name: "Testing", variant: "green" },
  { name: "Project Management", variant: "orange" },
  { name: "Planning", variant: "orange" },
  { name: "Presentation", variant: "purple" },
  { name: "Deployment / DevOps", variant: "blue" },
  { name: "Meeting", variant: "orange" },
  { name: "Other", variant: "default" },
];

/** Map category name -> badge variant */
export const CATEGORY_BADGE_MAP = Object.fromEntries(
  CONTRIBUTION_CATEGORIES.map((c) => [c.name, c.variant])
);

/** List of category names for form dropdowns */
export const CATEGORY_NAMES = CONTRIBUTION_CATEGORIES.map((c) => c.name);
