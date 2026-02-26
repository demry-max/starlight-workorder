import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32, className: "h-8 w-8" },
  md: { width: 36, height: 36, className: "h-9 w-9" },
  lg: { width: 56, height: 56, className: "h-14 w-14" },
} as const;

export function Logo({ size = "sm", className = "" }: LogoProps) {
  const config = sizeMap[size];
  return (
    <Image
      src="/logo.svg"
      alt="Starlight"
      width={config.width}
      height={config.height}
      className={`${config.className} rounded-lg ${className}`}
      priority
    />
  );
}
