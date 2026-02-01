import { PrismaClient, CategoryType } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const SARAH_EMAIL = "testuser1@example.com"

// Freelance income descriptions
const FREELANCE_INCOME_DESCRIPTIONS = [
  "Logo design for Acme Corp",
  "Website redesign - TechStart Inc",
  "Brand identity package - Green Solutions",
  "UI/UX design for mobile app - FinApp",
  "Marketing materials - Local Bakery",
  "Social media graphics package",
  "Illustration project - Publishing Co",
  "Product packaging design",
  "Annual report design - NonProfit Org",
  "Landing page design - SaaS Company",
  "E-commerce product photos editing",
  "Business card and letterhead design",
]

// Expense descriptions by category
const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  Rent: ["Monthly rent - February", "Monthly rent - January", "Monthly rent - December", "Monthly rent - November", "Monthly rent - October", "Monthly rent - September"],
  Utilities: ["Electric bill", "Gas bill", "Water bill", "Internet service", "Phone bill"],
  Food: ["Grocery shopping at Whole Foods", "Trader Joes groceries", "Lunch meeting with client", "Weekly groceries", "Coffee supplies for home office", "Dinner out - client celebration"],
  Transportation: ["Uber to client meeting", "Gas station fill-up", "Lyft to design conference", "Parking downtown"],
  Entertainment: ["Netflix subscription", "Spotify Premium", "Movie tickets", "Book purchase"],
  Healthcare: ["Pharmacy - prescription", "Annual checkup copay", "Dental cleaning"],
  "Other Expense": ["Adobe Creative Cloud subscription", "Figma Pro subscription", "Wacom tablet replacement", "New monitor for workspace", "Office supplies", "Coworking space day pass"],
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
  console.log("Seeding transactions for Sarah Johnson (testuser1@example.com)...")

  // Get Sarah's user record
  const user = await prisma.user.findUnique({
    where: { email: SARAH_EMAIL },
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

  // Generate income transactions (2-4 freelance payments per month, $500-5000)
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // 2-4 freelance payments per month
    const numPayments = getRandomInt(2, 4)
    for (let i = 0; i < numPayments; i++) {
      const amount = getRandomInt(500, 5000) * 100 // Convert to cents
      transactions.push({
        userId: user.id,
        type: CategoryType.income,
        amount,
        description: pickRandom(FREELANCE_INCOME_DESCRIPTIONS),
        categoryId: categoryMap["Freelance"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }
  }

  // Generate expense transactions
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // Rent - $1500 on the 1st of each month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: 150000, // $1500 in cents
      description: EXPENSE_DESCRIPTIONS["Rent"][monthOffset] || "Monthly rent",
      categoryId: categoryMap["Rent"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
    })

    // Utilities - $100-200 per month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(100, 200) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Utilities"]),
      categoryId: categoryMap["Utilities"],
      date: getRandomDate(monthStart, monthEnd),
    })

    // Food - $200-500, multiple transactions per month (2-3)
    const numFoodTransactions = getRandomInt(2, 3)
    for (let i = 0; i < numFoodTransactions; i++) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(50, 200) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Food"]),
        categoryId: categoryMap["Food"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Software subscriptions (every month or two)
    if (monthOffset % 2 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: 5499, // $54.99 Adobe CC
        description: "Adobe Creative Cloud subscription",
        categoryId: categoryMap["Other Expense"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Occasional equipment/supplies
    if (monthOffset % 3 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(50, 300) * 100,
        description: pickRandom(["Office supplies", "New monitor for workspace", "Wacom tablet replacement", "Ergonomic chair"]),
        categoryId: categoryMap["Other Expense"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Entertainment (occasional)
    if (monthOffset % 2 === 1) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(15, 100) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Entertainment"]),
        categoryId: categoryMap["Entertainment"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Transportation (occasional)
    if (monthOffset % 2 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(20, 80) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Transportation"]),
        categoryId: categoryMap["Transportation"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }
  }

  // Add a few more miscellaneous transactions to reach 30-40 total
  const additionalTransactions = [
    { cat: "Healthcare", amount: 3500, desc: "Pharmacy - prescription" },
    { cat: "Healthcare", amount: 5000, desc: "Annual checkup copay" },
    { cat: "Other Expense", amount: 1500, desc: "Figma Pro subscription" },
    { cat: "Entertainment", amount: 1299, desc: "Netflix subscription" },
    { cat: "Transportation", amount: 4500, desc: "Uber to client meeting" },
  ]

  for (const tx of additionalTransactions) {
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: tx.amount,
      description: tx.desc,
      categoryId: categoryMap[tx.cat],
      date: getRandomDate(sixMonthsAgo, now),
    })
  }

  console.log(`Creating ${transactions.length} transactions...`)

  // Insert all transactions
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx })
  }

  console.log(`Successfully created ${transactions.length} transactions for Sarah Johnson!`)

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
