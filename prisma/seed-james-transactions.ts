import { PrismaClient, CategoryType } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const JAMES_EMAIL = "testuser4@example.com"

// Part-time wage descriptions
const WAGE_DESCRIPTIONS = [
  "Paycheck - Week of Feb 1",
  "Paycheck - Week of Jan 15",
  "Paycheck - Week of Jan 1",
  "Paycheck - Week of Dec 15",
  "Paycheck - Week of Dec 1",
  "Paycheck - Week of Nov 15",
  "Paycheck - Week of Nov 1",
  "Paycheck - Week of Oct 15",
  "Paycheck - Week of Oct 1",
  "Paycheck - Week of Sep 15",
  "Paycheck - Week of Sep 1",
  "Paycheck - Week of Aug 15",
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
  Food: [
    "Groceries - Walmart",
    "Discount groceries - Aldi",
    "Weekly groceries - Food Lion",
    "Quick lunch - McDonalds",
    "Ramen and essentials",
    "Grocery run - dollar store",
    "Frozen dinners - Save-A-Lot",
    "Fast food dinner",
  ],
  Transportation: [
    "Bus pass monthly",
    "Gas for carpool",
    "Uber to work - emergency",
    "Bus fare - weekly passes",
    "Bike repair",
  ],
  Entertainment: [
    "Netflix subscription",
    "Spotify family plan share",
    "Movie rental - Redbox",
    "Coffee with friends",
    "Bowling night",
  ],
  Utilities: [
    "Electric bill",
    "Phone bill - prepaid",
    "Internet - basic plan",
    "Water bill",
  ],
  Healthcare: [
    "Pharmacy - cold medicine",
    "Urgent care copay",
    "Prescription refill",
  ],
  "Other Expense": [
    "Dollar store - household items",
    "Clothing - thrift store",
    "Laundromat",
    "Haircut - budget",
    "Library late fee",
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
  console.log("Seeding transactions for James Wilson (testuser4@example.com)...")

  // Get James's user record
  const user = await prisma.user.findUnique({
    where: { email: JAMES_EMAIL },
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

  const transactions: Array<{
    userId: string
    type: CategoryType
    amount: number
    description: string
    categoryId: string
    date: Date
  }> = []

  let wageDescIndex = 0

  // Generate income transactions - biweekly part-time wages $1200-1500
  // Note: Part-time means income is lower and less consistent
  // Some months have reduced hours (sick days, scheduling issues)
  const reducedIncomeMonths = [2, 4] // December and October had reduced hours

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const isReducedMonth = reducedIncomeMonths.includes(monthOffset)

    // First paycheck of the month (around the 1st)
    // Reduced months get lower pay ($800-1000 instead of $1200-1500)
    const firstPayAmount = isReducedMonth ? getRandomInt(800, 1000) : getRandomInt(1200, 1500)
    transactions.push({
      userId: user.id,
      type: CategoryType.income,
      amount: firstPayAmount * 100,
      description: WAGE_DESCRIPTIONS[wageDescIndex++] || `Paycheck - Early ${monthStart.toLocaleDateString("en-US", { month: "long" })}`,
      categoryId: categoryMap["Salary"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(1, 3)),
    })

    // Second paycheck of the month (around the 15th)
    const secondPayAmount = isReducedMonth ? getRandomInt(800, 1000) : getRandomInt(1200, 1500)
    transactions.push({
      userId: user.id,
      type: CategoryType.income,
      amount: secondPayAmount * 100,
      description: WAGE_DESCRIPTIONS[wageDescIndex++] || `Paycheck - Mid ${monthStart.toLocaleDateString("en-US", { month: "long" })}`,
      categoryId: categoryMap["Salary"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(14, 16)),
    })
  }

  // Generate expense transactions
  // Key: Expenses should sometimes exceed income to show financial stress
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // Rent - $900 on the 1st of each month (this is the biggest expense)
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: 90000, // $900 in cents
      description: EXPENSE_DESCRIPTIONS["Rent"][monthOffset] || "Monthly rent",
      categoryId: categoryMap["Rent"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
    })

    // Food - $200-300 per month (budget conscious, multiple small purchases)
    const foodAmount = getRandomInt(200, 300)
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: foodAmount * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Food"]),
      categoryId: categoryMap["Food"],
      date: getRandomDate(monthStart, monthEnd),
    })

    // Transportation - ~$100 per month (relies on bus mostly)
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(80, 120) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Transportation"]),
      categoryId: categoryMap["Transportation"],
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(1, 5)),
    })

    // Utilities - shared utilities, lower cost
    if (monthOffset % 2 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(60, 100) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Utilities"]),
        categoryId: categoryMap["Utilities"],
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(10, 20)),
      })
    }

    // Entertainment - $50-100 per month (limited budget)
    if (monthOffset % 2 === 1 || monthOffset === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(50, 100) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Entertainment"]),
        categoryId: categoryMap["Entertainment"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }
  }

  // Add significant unexpected expenses to create financial stress months
  // These target the months with reduced income to create deficits

  // December (monthOffset 2) - Holiday expenses when income was already reduced
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 35000, // $350 - holiday gifts on credit
    description: "Holiday gifts - Target",
    categoryId: categoryMap["Other Expense"],
    date: new Date(now.getFullYear(), now.getMonth() - 2, 20),
  })

  // December - Urgent care when sick (missed work = reduced hours)
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 22500, // $225 urgent care + meds
    description: "Urgent care copay - flu",
    categoryId: categoryMap["Healthcare"],
    date: new Date(now.getFullYear(), now.getMonth() - 2, 8),
  })

  // October (monthOffset 4) - Car trouble when hours were already reduced
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 45000, // $450 emergency car repair
    description: "Emergency car repair - alternator",
    categoryId: categoryMap["Transportation"],
    date: new Date(now.getFullYear(), now.getMonth() - 4, 15),
  })

  // October - Had to take Uber to work while car was in shop
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 18000, // $180 Uber rides for a week
    description: "Uber to work - car in shop",
    categoryId: categoryMap["Transportation"],
    date: new Date(now.getFullYear(), now.getMonth() - 4, 18),
  })

  // November - Phone replacement (budget)
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 15000, // $150 refurbished phone
    description: "Refurbished phone - replacement",
    categoryId: categoryMap["Other Expense"],
    date: new Date(now.getFullYear(), now.getMonth() - 3, 10),
  })

  // January - Winter heating bill spike
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 15000, // $150 extra on heating
    description: "Extra heating bill - cold snap",
    categoryId: categoryMap["Utilities"],
    date: new Date(now.getFullYear(), now.getMonth() - 1, 22),
  })

  console.log(`Creating ${transactions.length} transactions...`)

  // Insert all transactions
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx })
  }

  console.log(`Successfully created ${transactions.length} transactions for James Wilson!`)

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

  // Monthly breakdown to show stress months
  console.log(`\nMonthly breakdown (showing financial stress):`)
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)
    const monthName = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    const monthIncome = transactions
      .filter((t) => t.type === CategoryType.income && t.date >= monthStart && t.date <= monthEnd)
      .reduce((sum, t) => sum + t.amount, 0)
    const monthExpenses = transactions
      .filter((t) => t.type === CategoryType.expense && t.date >= monthStart && t.date <= monthEnd)
      .reduce((sum, t) => sum + t.amount, 0)
    const net = monthIncome - monthExpenses
    const status = net < 0 ? "⚠️ DEFICIT" : "✓ positive"

    console.log(`  ${monthName}: Income $${(monthIncome / 100).toFixed(2)}, Expenses $${(monthExpenses / 100).toFixed(2)}, Net: $${(net / 100).toFixed(2)} ${status}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
