"use client";

type Strength = "weak" | "okay" | "strong" | "great";

function getStrength(password: string): Strength | null {
  if (!password) return null;
  const len = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (len < 8) return "weak";
  if (len >= 12 && hasLower && hasUpper && hasDigit && hasSpecial) return "great";
  if (len >= 10 && hasLower && hasUpper && hasDigit) return "strong";
  if (len >= 8 && (hasDigit || hasSpecial)) return "okay";
  return "weak";
}

const LEVELS: Strength[] = ["weak", "okay", "strong", "great"];

const CONFIG: Record<Strength, { label: string; color: string; bars: number }> = {
  weak:   { label: "Weak",   color: "bg-red-400",    bars: 1 },
  okay:   { label: "Okay",   color: "bg-amber-400",  bars: 2 },
  strong: { label: "Strong", color: "bg-lime-500",   bars: 3 },
  great:  { label: "Great",  color: "bg-green-500",  bars: 4 },
};

export default function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password);
  if (!strength) return null;

  const { label, color, bars } = CONFIG[strength];

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i < bars ? color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-bold w-10 text-right ${
        strength === "weak"   ? "text-red-500"   :
        strength === "okay"   ? "text-amber-500" :
        strength === "strong" ? "text-lime-600"  :
                                "text-green-600"
      }`}>
        {label}
      </span>
    </div>
  );
}
