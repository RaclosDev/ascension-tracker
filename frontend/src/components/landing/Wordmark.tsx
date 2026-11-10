// The name set in the landing's display face, so the header and footer speak the same type as
// the headline instead of the app's brush logo.
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`landing-display landing-wordmark ${className}`}>
      Ascension<span className="text-[var(--landing-blue)]">.</span>
    </span>
  );
}
