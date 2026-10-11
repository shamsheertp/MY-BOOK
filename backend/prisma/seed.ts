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
        name: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '+1234567890',
      },
    });
    console.log('✓ Created default administrator:');
    console.log(`  Username / Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: admin123`);
    console.log(`  Role: ${admin.role}`);
  } else {
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
  } else {
    console.log('ℹ Accountant user already exists.');
  }

  // Seed Company Profile if not exists
  const existingCompany = await prisma.companyProfile.findFirst();
  if (!existingCompany) {
    const company = await prisma.companyProfile.create({
      data: {
        companyName: 'Capital Metal Craft',
        tagline: 'Smart Accounting for Growing Businesses',
        logo: '',
        email: 'support@mybook.com',
        phone: '+91 98765 43210',
        website: 'www.mybook.com',
        addressLine1: '123 Business Avenue, Suite 100',
        addressLine2: 'Tech District',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001',
        country: 'India',
        gstin: '22AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        bankName: 'HDFC Bank',
        accountHolder: 'My Book Pvt Ltd',
        accountNumber: '50100123456789',
        ifsc: 'HDFC0001234',
        upiId: 'mybook@hdfcbank',
        invoiceTerms: 'Payment is due within 15 days of the invoice date.\nPlease include the invoice number with your payment.',
        footerNote: 'Thank you for your business!',
        signatoryName: 'Authorized Signatory',
        showBankOnInvoice: true,
      },
    });
    console.log('✓ Created default company profile:', company.companyName);
  } else {
    console.log('ℹ Company profile already exists:', existingCompany.companyName);
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
