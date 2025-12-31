import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simulates a delay for async operations in the blueprint preview
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
