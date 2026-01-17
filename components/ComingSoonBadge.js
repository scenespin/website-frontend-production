/**
 * ComingSoonBadge Component
 * 
 * Reusable badge to indicate features that are coming soon.
 * Matches the blackout black cinema theme with cinema red accent.
 */

export default function ComingSoonBadge({ className = '', size = 'sm' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#DC143C]/20 border border-[#DC143C]/50 text-[#DC143C] font-semibold ${sizeClasses[size]} ${className}`}
      title="This feature is coming soon"
    >
      <span className="text-[10px]">🚧</span>
      <span>Coming Soon</span>
    </span>
  );
}
