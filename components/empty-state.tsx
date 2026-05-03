interface EmptyStateProps {
  message: string;
  sub?: string;
  children?: React.ReactNode;
}

export default function EmptyState({ message, sub, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <span className="text-4xl select-none" aria-hidden="true">🥃</span>
      <p className="text-sm font-bold text-[#0d3c54]">{message}</p>
      {sub && <p className="text-xs text-gray-500 max-w-xs">{sub}</p>}
      {children}
    </div>
  );
}
