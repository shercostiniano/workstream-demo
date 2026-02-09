import { PrismaClient, CategoryType } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const EMILY_EMAIL = "testuser3@example.com"

// Income descriptions - Business consulting and product sales
const CONSULTING_DESCRIPTIONS = [
  "Consulting - Tech Corp Q1 Strategy",
  "Consulting - StartupXYZ product roadmap",
  "Consulting - Global Finance restructuring",
  "Consulting - HealthTech compliance audit",
  "Consulting - RetailPro inventory optimization",
  "Consulting - CloudSync migration planning",
  "Consulting - DataFlow analytics setup",
  "Consulting - GreenEnergy sustainability report",
  "Strategy workshop - Acme Industries",
  "Process improvement consulting - MegaCorp",
  "Digital transformation project - TechStart",
  "Consulting retainer - Innovation Labs",
]

const PRODUCT_SALES_DESCRIPTIONS = [
  "Product sale - Business template bundle",
  "Product sale - Strategy playbook PDF",
  "Product sale - Consulting toolkit license",
  "Product sale - Online course access",
  "Product sale - Workshop materials",
  "Product sale - Process documentation kit",
  "Product sale - Analytics dashboard template",
  "Product sale - Project management templates",
]

// Expense descriptions by category
const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  Rent: [
    "Office space rent - February",
    "Office space rent - January",
    "Office space rent - December",
    "Office space rent - November",
    "Office space rent - October",
    "Office space rent - September",
  ],
  Utilities: [
    "Office internet - Comcast Business",
    "Office electricity",
    "Office phone line",
    "Cloud storage - Dropbox Business",
    "Zoom Pro subscription",
  ],
  "Office Supplies": [
    "Office supplies from Staples",
    "Printer paper and ink cartridges",
    "Notebooks and pens - Amazon",
    "Desk organizers - Container Store",
    "Business cards - Vistaprint",
    "Presentation folders and binders",
    "Filing cabinet - Office Depot",
    "Whiteboard and markers",
  ],
  Marketing: [
    "Facebook Ads campaign",
    "Google Ads - keyword campaign",
    "LinkedIn Premium subscription",
    "Email marketing - Mailchimp Pro",
    "Website hosting - GoDaddy",
    "Logo design - Fiverr",
    "Social media management - Buffer",
    "Content writing - freelancer",
    "Video production for promo",
    "Trade show booth rental",
  ],
  "Professional Services": [
    "Contractor payment - web developer",
    "Contractor payment - graphic designer",
    "Bookkeeping services - monthly",
    "Legal consultation - contract review",
    "Tax preparation services",
    "Virtual assistant - 20 hours",
    "Copywriting services",
    "SEO consultant - monthly retainer",
  ],
  Transportation: [
    "Uber to client meeting",
    "Parking at client office",
    "Flight to conference - San Francisco",
    "Hotel for business trip",
    "Mileage reimbursement",
    "Taxi to airport",
  ],
  Food: [
    "Client lunch - downtown restaurant",
    "Office coffee and snacks",
    "Team lunch meeting",
    "Networking dinner",
    "Coffee meeting with prospect",
  ],
  "Other Expense": [
    "Professional membership - Chamber of Commerce",
    "Conference registration fee",
    "Online course - business development",
    "Software license - project management",
    "Insurance premium - professional liability",
    "Bank fees",
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
  console.log("Seeding transactions for Emily Rodriguez (testuser3@example.com)...")

  // Get Emily's user record
  const user = await prisma.user.findUnique({
    where: { email: EMILY_EMAIL },
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

  // Generate income transactions - variable consulting fees and product sales
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // 2-4 consulting projects per month ($2000-8000 each)
    const consultingCount = getRandomInt(2, 4)
    for (let i = 0; i < consultingCount; i++) {
      transactions.push({
        userId: user.id,
        type: CategoryType.income,
        amount: getRandomInt(2000, 8000) * 100, // $2000-8000 in cents
        description: pickRandom(CONSULTING_DESCRIPTIONS),
        categoryId: categoryMap["Freelance"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // 1-3 product sales per month ($500-2000 each)
    const salesCount = getRandomInt(1, 3)
    for (let i = 0; i < salesCount; i++) {
      transactions.push({
        userId: user.id,
        type: CategoryType.income,
        amount: getRandomInt(500, 2000) * 100, // $500-2000 in cents
        description: pickRandom(PRODUCT_SALES_DESCRIPTIONS),
        categoryId: categoryMap["Other Income"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }
  }

  // Generate expense transactions
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)

    // Office rent - $800 on the 1st of each month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: 80000, // $800 in cents
      description: EXPENSE_DESCRIPTIONS["Rent"][monthOffset] || "Office space rent",
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
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), getRandomInt(10, 20)),
    })

    // Office Supplies - $100-500 per month (not every month)
    if (monthOffset % 2 === 0 || monthOffset === 1) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(100, 500) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Office Supplies"]),
        categoryId: categoryMap["Other Expense"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Marketing - $200-1000 per month
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(200, 1000) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Marketing"]),
      categoryId: categoryMap["Other Expense"],
      date: getRandomDate(monthStart, monthEnd),
    })

    // Contractor payments - 1-2 per month ($300-1500 each)
    const contractorCount = getRandomInt(1, 2)
    for (let i = 0; i < contractorCount; i++) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(300, 1500) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Professional Services"]),
        categoryId: categoryMap["Other Expense"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Transportation - occasional client meetings
    if (monthOffset % 2 === 0) {
      transactions.push({
        userId: user.id,
        type: CategoryType.expense,
        amount: getRandomInt(50, 300) * 100,
        description: pickRandom(EXPENSE_DESCRIPTIONS["Transportation"]),
        categoryId: categoryMap["Transportation"],
        date: getRandomDate(monthStart, monthEnd),
      })
    }

    // Food - client meetings and office supplies
    transactions.push({
      userId: user.id,
      type: CategoryType.expense,
      amount: getRandomInt(50, 200) * 100,
      description: pickRandom(EXPENSE_DESCRIPTIONS["Food"]),
      categoryId: categoryMap["Food"],
      date: getRandomDate(monthStart, monthEnd),
    })
  }

  // Add a few larger one-time expenses
  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 150000, // $1500 - conference trip
    description: "Business conference - annual industry summit",
    categoryId: categoryMap["Other Expense"],
    date: getRandomDate(sixMonthsAgo, now),
  })

  transactions.push({
    userId: user.id,
    type: CategoryType.expense,
    amount: 250000, // $2500 - professional liability insurance
    description: "Professional liability insurance - annual premium",
    categoryId: categoryMap["Other Expense"],
    date: new Date(now.getFullYear(), now.getMonth() - 4, 15),
  })

  console.log(`Creating ${transactions.length} transactions...`)

  // Insert all transactions
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx })
  }

  console.log(`Successfully created ${transactions.length} transactions for Emily Rodriguez!`)

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
