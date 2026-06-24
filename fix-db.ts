import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.transaction.updateMany({
    data: { buyerPhone: null }
  })
}
main()
