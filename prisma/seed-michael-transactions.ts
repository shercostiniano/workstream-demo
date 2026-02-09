import { PrismaClient, CategoryType } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const MICHAEL_EMAIL = "testuser2@example.com"

// Salary income descriptions
const SALARY_DESCRIPTIONS = [
  "Monthly salary - February 2026",
  "Monthly salary - January 2026",
  "Monthly salary - December 2025",
  "Monthly salary - November 2025",
  "Monthly salary - October 2025",
  "Monthly salary - September 2025",
]

// Expense descriptions by category
const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  Rent: [
    "Monthly rent - February",
    "Monthly rent - January",
    "Monthly rent - December",
    "Monthly rent - November",
    "Monthly rent - October",
    "Monthly rent - September",
  ],
  Utilities: [
    "Electric bill",
    "Gas bill",
    "Water and sewer",
    "Internet service - Comcast",
    "Phone bill - Verizon",
  ],
  Food: [
    "Grocery shopping at Trader Joes",
    "Weekly groceries - Safeway",
    "Costco bulk shopping",
    "Lunch at work cafeteria",
    "Dinner with friends",
    "Coffee shop - morning coffee",
    "Thai takeout",
    "Pizza delivery",
  ],
  Transportation: [
    "Monthly transit pass",
    "Gas station - Shell",
    "Car insurance premium",
    "Parking garage monthly",
    "Uber ride home",
    "Car wash",
  ],
  Entertainment: [
    "Netflix subscription",
    "Spotify Premium",
    "Movie night - AMC",
    "Concert tickets",
    "Video game purchase - Steam",
    "Bowling night with coworkers",
    "Gym membership - 24 Hour Fitness",
  ],
  Healthcare: ["Pharmacy - vitamins", "Doctor visit copay", "Dental cleaning"],
  "Other Expense": [
    "Amazon purchase - household items",
    "Clothing - Target",
    "Haircut",
    "Dry cleaning",
    "Birthday gift for mom",
  ],
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime()
  const endTime = endDate.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log("Seeding transactions for Michael Chen (testuser2@example.com)...")

  // Get Michael's user record
  const user = await prisma.user.findUnique({
    where: { email: MICHAEL_EMAIL },
    include: { categories: true },
  })

  if (!user) {
    console.error("User not found! Make sure to run seed-test-users.ts first.")
    process.exit(1)
  }

  console.log(`Found user: ${user.name} (${user.id})`)

  // Get category IDs
  const categoryMap: Record<string, string> = {}
  for (const cat of user.categories) {
    categoryMap[cat.name] = cat.id
  }

  console.log("Categories:", Object.keys(categoryMap))

  // Calculate date range (last 6 months)
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const transactions: Array<{
    userId: string
    type: CategoryType
    amount: number
    description: string
    categoryId: string
    date: Date
  }> = []

  // Generate income transactions - consistent monthly salary of $4500 on the 1st
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)

    // Monthly salary - $4500 on the 1st
    transactions.push({
      userId: user.id,
      type: CategoryType.income,
      amount: 450000, // $4500 in cents
      description: SALARY_DESCRIPTIONS[monthOffset] || `Monthly salary - ${monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      categoryId: categoryMap["Salary"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
    })
  }

  // Add occasional bonus (one time, 3 months ago)
  const bonusDate = new Date(now.getFullYear(), now.getMonth() - 3, 15)
  transactions.push({
    userId: user.id,
    type: CategoryType.income,
    amount: 200000, // $2000 bonus in cents
    description: "Q4 Performance bonus",
    categoryId: categoryMap["Salary"],
    date: bonusDate,
  })

  // Generate expense transactions
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // Rent - $1800 on the 1st of each month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: 180000, // $1800 in cents
      description: EXPENSE_DESCRIPTIONS["Rent"][monthOffset] || "Monthly rent",
      categoryId: categoryMap["Rent"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
    })

    // Utilities - ~$150 per month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(130, 170) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Utilities"]),
      categoryId: categoryMap["Utilities"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(10, 20)),
    })

    // Food - $400-600 per month, one transaction
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(400, 600) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Food"]),
      categoryId: categoryMap["Food"],
      date: getRandomDate(monthStart, monthEnd),
    })

    // Transportation - ~$200 per month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(180, 220) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Transportation"]),
      categoryId: categoryMap["Transportation"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(1, 5)),
    })

    // Entertainment - $100-300 per month (not every month)
    if (monthOffset % 2 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(100, 300) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Entertainment"]),
        categoryId: categoryMap["Entertainment"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }
  }

  // Add a healthcare transaction
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 3000, // $30 doctor visit copay
    description: "Doctor visit copay",
    categoryId: categoryMap["Healthcare"],
    date: getRandomDate(sixMonthsAgo, now),
  })

  console.log(`Creating ${transactions.length} transactions...`)

  // Insert all transactions
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx })
  }

  console.log(`Successfully created ${transactions.length} transactions for Michael Chen!`)

  // Summary
  const incomeCount = transactions.filter((t) => t.type === CategoryType.income).length
  const expenseCount = transactions.filter((t) => t.type === CategoryType.expense).length
  const totalIncome = transactions.filter((t) => t.type === CategoryType.income).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === CategoryType.expense).reduce((sum, t) => sum + t.amount, 0)

  console.log(`\nSummary:`)
  console.log(`- Income transactions: ${incomeCount}`)
  console.log(`- Expense transactions: ${expenseCount}`)
  console.log(`- Total Income: $${(totalIncome / 100).toFixed(2)}`)
  console.log(`- Total Expenses: $${(totalExpenses / 100).toFixed(2)}`)
  console.log(`- Net: $${((totalIncome - totalExpenses) / 100).toFixed(2)}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
