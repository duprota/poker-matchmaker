
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function standardizeDate(dateString: string): string {
  // Remove any time component and return just the YYYY-MM-DD
  if (!dateString) return '';
  return dateString.split('T')[0];
}
