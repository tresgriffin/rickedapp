import Image from "next/image";

interface AvatarProps {
  displayName: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { container: "w-8 h-8", text: "text-xs", img: 32 },
  md: { container: "w-10 h-10", text: "text-sm", img: 40 },
  lg: { container: "w-16 h-16", text: "text-xl", img: 64 },
};

export default function Avatar({ displayName, avatarUrl, size = "md" }: AvatarProps) {
  const { container, text, img } = SIZES[size];
  const initial = (displayName ?? "?").charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName ?? "User"}
        width={img}
        height={img}
        className={`${container} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${container} rounded-full bg-[#0d3c54] flex items-center justify-center flex-shrink-0`}
      aria-label={displayName ?? "User"}
    >
      <span className={`${text} font-bold text-[#fffbfa] select-none`}>{initial}</span>
    </div>
  );
}
