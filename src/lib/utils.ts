
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "Not set";
  try {
    return format(parseISO(dateString), "PPP");
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateString);
    return "Invalid date";
  }
}

/**
 * Strips HTML tags from a string and returns plain text.
 * Handles full HTML documents including DOCTYPE, head, body, style, and script tags.
 *
 * @param html - The HTML string to strip
 * @returns Plain text with all HTML tags removed and whitespace normalized
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // First, use regex to strip out common HTML structures that might not parse well in a div
  const cleaned = html
    // Remove DOCTYPE, html, head, and body tags
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Now use DOM to strip remaining HTML tags
  const tmp = document.createElement('div');
  tmp.innerHTML = cleaned;

  // Get text content and clean up excessive whitespace
  const text = (tmp.textContent || tmp.innerText || '').trim();
  return text.replace(/\s+/g, ' ');
}
