import type { CurrencyCode } from "@/constants/currencies";

export interface AdminStats {
  totalUsers: number;
  totalScans: number;
  successRate: number;
  lowConfidenceCount: number;
  currencyUsage: { code: CurrencyCode; count: number }[];
  modelAccuracy: { label: string; value: number }[];
  recentActivity: {
    id: string;
    user: string;
    action: string;
    time: string;
  }[];
}

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 1284,
  totalScans: 47210,
  successRate: 0.9218,
  lowConfidenceCount: 3723,
  currencyUsage: [
    { code: "INR", count: 18342 },
    { code: "USD", count: 11420 },
    { code: "PHP", count: 6412 },
    { code: "EUR", count: 5108 },
    { code: "AUD", count: 3862 },
    { code: "CAD", count: 2066 },
  ],
  modelAccuracy: [
    { label: "INR", value: 0.95 },
    { label: "USD", value: 0.93 },
    { label: "PHP", value: 0.91 },
    { label: "EUR", value: 0.9 },
    { label: "AUD", value: 0.89 },
    { label: "CAD", value: 0.88 },
  ],
  recentActivity: [
    { id: "a1", user: "user_8821", action: "Scanned INR ₹500", time: "2 min ago" },
    { id: "a2", user: "user_1044", action: "Low-confidence hit (USD)", time: "9 min ago" },
    { id: "a3", user: "user_5120", action: "Updated voice settings", time: "14 min ago" },
    { id: "a4", user: "user_2318", action: "Scanned PHP ₱1000", time: "22 min ago" },
    { id: "a5", user: "user_7700", action: "Registered new account", time: "31 min ago" },
  ],
};