import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced currency formatting with multi-currency support
export function formatCurrency(amount: number, currency: string = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US"
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Get currency symbol
export function getCurrencySymbol(currency: string = "INR"): string {
  const symbols: Record<string, string> = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "د.إ",
    "SAR": "ر.س",
  }
  return symbols[currency] || currency
}

// Format currency for display with symbol
export function formatCurrencyDisplay(amount: number, currency: string = "INR"): string {
  const symbol = getCurrencySymbol(currency)
  const locale = currency === "INR" ? "en-IN" : "en-US"
  
  return new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${symbol}`
}

// Format currency for charts and compact display
export function formatCurrencyCompact(amount: number, currency: string = "INR"): string {
  const symbol = getCurrencySymbol(currency)
  
  if (amount >= 10000000) { // 1 crore
    return `${(amount / 10000000).toFixed(1)}Cr ${symbol}`
  } else if (amount >= 100000) { // 1 lakh
    return `${(amount / 100000).toFixed(1)}L ${symbol}`
  } else if (amount >= 1000) { // 1 thousand
    return `${(amount / 1000).toFixed(1)}K ${symbol}`
  } else {
    return `${amount.toLocaleString()} ${symbol}`
  }
}

export function getStartOfWeek(date: Date): Date {
  const day = date.getDay() // 0 for Sunday, 1 for Monday, etc.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust to get Monday
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Add these utility functions for file handling

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)

  // Format: "Jan 1, 2023"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Add the formatPercentage function after the formatDate function

export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return "0%"
  }
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}
