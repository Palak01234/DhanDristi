import { Eye } from "lucide-react";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  dark?: boolean;
}

const SIZES = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};
const ICON = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function BrandMark({ size = "md", dark = false }: BrandMarkProps) {
  return (
    <div
      role="img"
      aria-label="DhanDrishti logo"
      className={`relative flex shrink-0 items-center justify-center rounded-2xl ${SIZES[size]} ${
        dark
          ? "bg-background-50/10 ring-1 ring-background-50/20"
          : "bg-gradient-to-br from-primary-500 to-primary-700"
      }`}
    >
      <Eye
        aria-hidden="true"
        className={`${ICON[size]} ${dark ? "text-background-50" : "text-background-50"}`}
        strokeWidth={2.3}
      />
    </div>
  );
}