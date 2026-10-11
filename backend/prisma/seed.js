import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding database...');
    const adminEmail = 'admin@mybook.com';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: Role.ADMIN,
                status: UserStatus.ACTIVE,
                phone: '+1234567890',
            },
        });
        console.log('✓ Created default administrator:');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Password: admin123`);
        console.log(`  Role: ${admin.role}`);
    }
    else {
        console.log('ℹ Admin user already exists.');
    }
    // Also create a demo staff accountant
    const accountantEmail = 'accountant@mybook.com';
    const existingAccountant = await prisma.user.findUnique({
        where: { email: accountantEmail },
    });
    if (!existingAccountant) {
        const hashedPassword = await bcrypt.hash('accountant123', 10);
        const accountant = await prisma.user.create({
            data: {
                name: 'Jane Accountant',
                email: accountantEmail,
                password: hashedPassword,
                role: Role.ACCOUNTANT,
                status: UserStatus.ACTIVE,
                phone: '+1987654321',
            },
        });
        console.log('✓ Created default accountant:');
        console.log(`  Email: ${accountant.email}`);
        console.log(`  Password: accountant123`);
    }
    console.log('Seed completed successfully.');
}
main()
    .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
