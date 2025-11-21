// src/lib/utils.ts
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}