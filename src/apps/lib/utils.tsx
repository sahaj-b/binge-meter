import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Underline({ text }: { text: string }) {
  return (
    <mark className="bg-transparent text-foreground relative px-1">
      <span className="relative z-10">{text}</span>
      <span className="absolute inset-x-0 bottom-0 w-[98%] h-2.5 md:h-3 bg-accent/80 -rotate-[0.5deg] transform" />
    </mark>
  );
}
