import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indian Rupees
 * Example: 12345 -> "12,345"
 */
export function formatIndianRupees(amount: number): string {
  return amount.toLocaleString('en-IN');
}
