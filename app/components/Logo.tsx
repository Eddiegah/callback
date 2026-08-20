export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cb-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#cb-grad)" />
      <path
        d="M13.5 14c0-1.4 1.1-2.5 2.5-2.5h.8c.6 0 1.1.4 1.3.9l.9 2.2c.2.5.1 1.2-.3 1.6l-1 1c.9 1.9 2.4 3.4 4.3 4.3l1-1c.4-.4 1-.5 1.6-.3l2.2.9c.6.2.9.7.9 1.3v.8c0 1.4-1.1 2.5-2.5 2.5-7.5 0-13.7-6.2-13.7-13.7Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M25 10.5l3 3m0-3l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
