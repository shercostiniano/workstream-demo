import { PrismaClient, CategoryType } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Other Income",
]

const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Food",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Other Expense",
]

async function seedDefaultCategories(userId: string): Promise<void> {
  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((name) => ({
    userId,
    name,
    type: CategoryType.income,
    isDefault: true,
  }))

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
    userId,
    name,
    type: CategoryType.expense,
    isDefault: true,
  }))

  await prisma.category.createMany({
    data: [...incomeCategories, ...expenseCategories],
  })
}

const TEST_USERS = [
  { email: "testuser1@example.com", name: "Sarah Johnson" },
  { email: "testuser2@example.com", name: "Michael Chen" },
  { email: "testuser3@example.com", name: "Emily Rodriguez" },
  { email: "testuser4@example.com", name: "James Wilson" },
  { email: "testuser5@example.com", name: "Amanda Foster" },
]

const PASSWORD = "admin123"

async function main() {
  console.log("Seeding test users...")

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  for (const userData of TEST_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      console.log(`User ${userData.email} already exists, skipping...`)
      continue
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
      },
    })

    await seedDefaultCategories(user.id)
    console.log(`Created user: ${userData.email} (${userData.name})`)
  }

  console.log("Test users seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
