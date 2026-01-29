"use server"

import { prisma } from "@/lib/prisma"
import { seedDefaultCategories } from "@/lib/seed-categories"
import bcrypt from "bcryptjs"

export type RegisterResult =
  | { success: true }
  | { success: false; error: string }

interface RegisterInput {
  email: string
  password: string
  confirmPassword: string
  name: string
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, password, confirmPassword, name } = input

  // Validation
  if (!email || !password || !confirmPassword || !name) {
    return { success: false, error: "All fields are required" }
  }

  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email format" }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
    },
  })

  // Seed default categories for the new user
  await seedDefaultCategories(user.id)

  return { success: true }
}
