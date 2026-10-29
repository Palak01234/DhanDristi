import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  label?: string;
  as?: "div" | "article" | "section";
}

export function Card({ children, className = "", label, as = "div" }: CardProps) {
  const Tag = as;
  return (
    <Tag
      aria-label={label}
      className={`surface rounded-2xl p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}