import { PrismaClient, InvoiceStatus } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "dev.db"
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const EMILY_EMAIL = "testuser3@example.com"

// Realistic client data
const CLIENTS = [
  {
    name: "Tech Innovations LLC",
    email: "billing@techinnovations.com",
  },
  {
    name: "Global Solutions Inc",
    email: "accounts@globalsolutions.com",
  },
  {
    name: "StartupXYZ",
    email: "finance@startupxyz.io",
  },
  {
    name: "Acme Industries",
    email: "ap@acmeindustries.com",
  },
  {
    name: "Digital Dynamics Corp",
    email: "payments@digitaldynamics.com",
  },
]

// Invoice line item templates
const LINE_ITEMS = [
  { description: "Strategic consulting - initial assessment", unitPrice: 150000 }, // $1500
  { description: "Business process analysis", unitPrice: 200000 }, // $2000
  { description: "Market research report", unitPrice: 250000 }, // $2500
  { description: "Implementation support (per day)", unitPrice: 80000 }, // $800
  { description: "Training workshop (half-day)", unitPrice: 100000 }, // $1000
  { description: "Training workshop (full-day)", unitPrice: 175000 }, // $1750
  { description: "Project management (monthly)", unitPrice: 300000 }, // $3000
  { description: "Technical documentation", unitPrice: 75000 }, // $750
  { description: "Follow-up consultation (per hour)", unitPrice: 15000 }, // $150
  { description: "Strategy roadmap development", unitPrice: 350000 }, // $3500
  { description: "Performance optimization review", unitPrice: 180000 }, // $1800
  { description: "Stakeholder interview sessions", unitPrice: 120000 }, // $1200
]

function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(index + 1).padStart(4, "0")}`
}

async function main() {
  console.log("Seeding invoices for Emily Rodriguez (testuser3@example.com)...")

  // Get Emily's user record
  const user = await prisma.user.findUnique({
    where: { email: EMILY_EMAIL },
  })

  if (!user) {
    console.error("User not found! Make sure to run seed-test-users.ts first.")
    process.exit(1)
  }

  console.log(`Found user: ${user.name} (${user.id})`)

  // Check if Emily already has invoices
  const existingInvoices = await prisma.invoice.count({
    where: { userId: user.id },
  })

  if (existingInvoices > 0) {
    console.log(`Emily already has ${existingInvoices} invoices. Skipping seed.`)
    return
  }

  const now = new Date()

  // Invoice 1: Draft - Tech Innovations LLC (recent, not yet sent)
  // Amount: ~$5,500
  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: generateInvoiceNumber(0),
      clientName: CLIENTS[0].name,
      clientEmail: CLIENTS[0].email,
      status: InvoiceStatus.draft,
      issueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() - 2),
      notes: "Q1 consulting engagement - draft for review",
      items: {
        create: [
          { description: "Strategic consulting - initial assessment", quantity: 1, unitPrice: 150000 },
          { description: "Business process analysis", quantity: 2, unitPrice: 200000 },
        ],
      },
    },
    include: { items: true },
  })
  console.log(`Created invoice 1 (draft): ${invoice1.invoiceNumber} - ${CLIENTS[0].name}`)

  // Invoice 2: Sent - Global Solutions Inc (sent 2 weeks ago, due in 2 weeks)
  // Amount: ~$7,500
  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: generateInvoiceNumber(1),
      clientName: CLIENTS[1].name,
      clientEmail: CLIENTS[1].email,
      status: InvoiceStatus.sent,
      issueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      notes: "Payment due within 30 days. Thank you for your business!",
      items: {
        create: [
          { description: "Market research report", quantity: 1, unitPrice: 250000 },
          { description: "Strategy roadmap development", quantity: 1, unitPrice: 350000 },
          { description: "Follow-up consultation (per hour)", quantity: 10, unitPrice: 15000 },
        ],
      },
    },
    include: { items: true },
  })
  console.log(`Created invoice 2 (sent): ${invoice2.invoiceNumber} - ${CLIENTS[1].name}`)

  // Invoice 3: Sent - StartupXYZ (sent last month, overdue by 5 days)
  // Amount: ~$4,350
  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: generateInvoiceNumber(2),
      clientName: CLIENTS[2].name,
      clientEmail: CLIENTS[2].email,
      status: InvoiceStatus.sent,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      notes: "NET 30 terms. Please remit payment promptly.",
      items: {
        create: [
          { description: "Training workshop (full-day)", quantity: 2, unitPrice: 175000 },
          { description: "Technical documentation", quantity: 1, unitPrice: 75000 },
          { description: "Follow-up consultation (per hour)", quantity: 6, unitPrice: 15000 },
        ],
      },
    },
    include: { items: true },
  })
  console.log(`Created invoice 3 (sent - overdue): ${invoice3.invoiceNumber} - ${CLIENTS[2].name}`)

  // Invoice 4: Paid - Acme Industries (paid last month)
  // Amount: ~$8,000
  const invoice4 = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: generateInvoiceNumber(3),
      clientName: CLIENTS[3].name,
      clientEmail: CLIENTS[3].email,
      status: InvoiceStatus.paid,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      notes: "Paid in full. Thank you!",
      items: {
        create: [
          { description: "Project management (monthly)", quantity: 2, unitPrice: 300000 },
          { description: "Performance optimization review", quantity: 1, unitPrice: 180000 },
          { description: "Follow-up consultation (per hour)", quantity: 2, unitPrice: 15000 },
        ],
      },
    },
    include: { items: true },
  })
  console.log(`Created invoice 4 (paid): ${invoice4.invoiceNumber} - ${CLIENTS[3].name}`)

  // Invoice 5: Cancelled - Digital Dynamics Corp (project cancelled)
  // Amount: ~$2,500 (would have been)
  const invoice5 = await prisma.invoice.create({
    data: {
      userId: user.id,
      invoiceNumber: generateInvoiceNumber(4),
      clientName: CLIENTS[4].name,
      clientEmail: CLIENTS[4].email,
      status: InvoiceStatus.cancelled,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      notes: "Cancelled - project scope changed. No payment required.",
      items: {
        create: [
          { description: "Stakeholder interview sessions", quantity: 1, unitPrice: 120000 },
          { description: "Implementation support (per day)", quantity: 1, unitPrice: 80000 },
          { description: "Training workshop (half-day)", quantity: 1, unitPrice: 100000 },
        ],
      },
    },
    include: { items: true },
  })
  console.log(`Created invoice 5 (cancelled): ${invoice5.invoiceNumber} - ${CLIENTS[4].name}`)

  // Summary
  console.log("\n=== Invoice Summary ===")
  const invoices = [invoice1, invoice2, invoice3, invoice4, invoice5]
  for (const inv of invoices) {
    const total = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    console.log(`${inv.invoiceNumber}: ${inv.clientName} - ${inv.status.toUpperCase()} - $${(total / 100).toFixed(2)} (${inv.items.length} items)`)
  }

  const totalAll = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0)
  }, 0)

  console.log(`\nTotal invoice value: $${(totalAll / 100).toFixed(2)}`)
  console.log("Successfully created 5 invoices for Emily Rodriguez!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
