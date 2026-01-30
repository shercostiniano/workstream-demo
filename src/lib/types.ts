// Shared types that can be used in both client and server components
// These are re-exported to avoid importing from @/generated/prisma/client in client components
// which pulls in Node.js-only code

// Category type - mirrors the Prisma enum
export type CategoryType = "income" | "expense"

// Re-export type as an object with enum-like values for runtime comparison
export const CategoryType = {
  income: "income" as const,
  expense: "expense" as const,
}
