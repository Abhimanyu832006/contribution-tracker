/**
 * Flat animated placeholder block — brutalist equivalent of a shimmer
 * skeleton. Compose with width/height utility classes.
 */
export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}
