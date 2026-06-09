/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AppLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeClass: Record<NonNullable<AppLogoProps["size"]>, string> = {
  xs: "h-7 w-7",
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
  "2xl": "h-32 w-32",
};

export default function AppLogo({ size = "sm", className = "" }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Farg'ona Jamoat Salomatligi Tibbiyot Instituti"
      className={`shrink-0 rounded-full object-cover ${sizeClass[size]} ${className}`}
    />
  );
}
