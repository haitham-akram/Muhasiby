const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@muhasiby.com'
  const plainPassword = 'muhasib2000'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.')
    return
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin user created successfully!')
  console.log(`Email: ${admin.email}`)
  console.log(`Role: ${admin.role}`)
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
