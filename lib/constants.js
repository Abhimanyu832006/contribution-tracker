/**
 * Shared Application Constants
 */

/*
 * Category no longer carries its own color. In the logbook system, color is
 * spent on two things that actually mean something: SOURCE (system teal vs.
 * human terracotta) and VERIFICATION (the stamp). A third, arbitrary color
 * axis for category was noise — ten unrelated hues that didn't map to
 * anything the product actually distinguishes. Categories are quiet, plain
 * tags now; the two-voice color system carries the meaning instead.
 */
export const CONTRIBUTION_CATEGORIES = [
  { name: "Code", variant: "default" },
  { name: "Research", variant: "default" },
  { name: "Design", variant: "default" },
  { name: "Documentation", variant: "default" },
  { name: "Testing", variant: "default" },
  { name: "Project Management", variant: "default" },
  { name: "Planning", variant: "default" },
  { name: "Presentation", variant: "default" },
  { name: "Deployment / DevOps", variant: "default" },
  { name: "Meeting", variant: "default" },
  { name: "Other", variant: "default" },
];

/** Map category name -> badge variant */
export const CATEGORY_BADGE_MAP = Object.fromEntries(
  CONTRIBUTION_CATEGORIES.map((c) => [c.name, c.variant])
);

/** List of category names for form dropdowns */
export const CATEGORY_NAMES = CONTRIBUTION_CATEGORIES.map((c) => c.name);
