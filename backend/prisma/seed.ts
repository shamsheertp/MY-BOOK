import { PrismaClient, Role, UserStatus, SaleStatus, PurchaseStatus } from '@prisma/client';
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

  // Seed initial contacts
  const contactsCount = await prisma.contact.count();
  if (contactsCount === 0) {
    const contactsToSeed = [
      {
        code: 'CONT-001',
        contactName: 'John Smith',
        companyName: 'ABC Trading LLC',
        email: 'john.smith@abctrading.com',
        phone: '+971544217778',
        receivables: 35000.00,
        payables: 15500.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=JS&backgroundColor=e0e7ff&textColor=4f46e5',
        address: '123 Business Avenue, Tech District, 54321',
        taxNumber: '22AAAAA0001A1Z1',
        notes: 'Key partner for trading and wholesale supply',
      },
      {
        code: 'CONT-002',
        contactName: 'Sarah Johnson',
        companyName: 'Global Tech Solutions',
        email: 'sarah.j@globaltech.com',
        phone: '+91 91234 56789',
        receivables: 0.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SJ&backgroundColor=dcfce7&textColor=16a34a',
        address: '456 Innovation Park, Cyber City, 54322',
        taxNumber: '22AAAAA0002A1Z2',
        notes: 'Software development client',
      },
      {
        code: 'CONT-003',
        contactName: 'Michael Chen',
        companyName: 'Chen Imports',
        email: 'm.chen@chenimports.com',
        phone: '+91 99887 76655',
        receivables: 45000.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=f3f4f6&textColor=4b5563',
        address: '789 Trade Center, Commerce Blvd, 54323',
        taxNumber: '22AAAAA0003A1Z3',
        notes: 'Seasonal bulk purchaser',
      },
      {
        code: 'CONT-004',
        contactName: 'Priya Sharma',
        companyName: 'Sharma Enterprises',
        email: 'priya@sharmaent.in',
        phone: '+91 98765 12345',
        receivables: 120000.00,
        payables: 45000.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=fef3c7&textColor=d97706',
        address: '321 Market Square, Industrial Area, 54324',
        taxNumber: '22AAAAA0004A1Z4',
        notes: 'High-volume recurring transactions',
      },
      {
        code: 'CONT-005',
        contactName: 'David Wilson',
        companyName: 'Wilson Logistics',
        email: 'david.w@wilsonlogistics.com',
        phone: '+91 93344 55667',
        receivables: 0.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DW&backgroundColor=e0f2fe&textColor=0284c7',
        address: '555 Transport Hub, Cargo District, 54325',
        taxNumber: '22AAAAA0005A1Z5',
        notes: 'Logistics and freight distribution',
      },
      {
        code: 'CONT-006',
        contactName: 'Mark Smith',
        companyName: 'Office Supplies Co.',
        email: 'mark@officesupplies.com',
        phone: '+91 98765 00002',
        receivables: 0.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=OS&backgroundColor=dcfce7&textColor=16a34a',
        address: '900 Supply Chain Rd, Warehouse District, 54326',
        taxNumber: '22AAAAA0006A1Z6',
        notes: 'Stationery and supplies vendor',
      },
      {
        code: 'CONT-007',
        contactName: 'Sarah Connor',
        companyName: 'Cloud Hosting Solutions',
        email: 'sarah@cloudhosting.net',
        phone: '+91 98765 00003',
        receivables: 0.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CH&backgroundColor=f3f4f6&textColor=4b5563',
        address: '1 Cloud Way, Server City, 54327',
        taxNumber: '22AAAAA0007A1Z7',
        notes: 'Infrastructure and cloud server vendor',
      },
      {
        code: 'CONT-008',
        contactName: 'Emily Davis',
        companyName: 'Secure IT Services',
        email: 'emily@secureit.com',
        phone: '+91 98765 00006',
        receivables: 0.00,
        payables: 0.00,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SI&backgroundColor=fee2e2&textColor=dc2626',
        address: '77 Security Blvd, Tech Park, 54328',
        taxNumber: '22AAAAA0008A1Z8',
        notes: 'Security hardware and networking support',
      },
    ];

    for (const c of contactsToSeed) {
      await prisma.contact.create({ data: c });
    }
    console.log(`✓ Seeded ${contactsToSeed.length} default contacts.`);
  } else {
    console.log(`ℹ Contacts already exist (${contactsCount} records).`);
  }

  // Seed initial products (with stock in kg, cost/kg, selling/kg)
  const productsCount = await prisma.product.count();
  if (productsCount === 0) {
    const productsToSeed = [
      {
        sku: 'PRD-001',
        name: 'Stainless Steel 304 Sheet',
        category: 'Stainless Steel',
        costPricePerKg: 280.00,
        sellingPricePerKg: 345.00,
        stockKg: 450.00,
        minStockKg: 50.00,
        unit: 'kg',
        description: 'High quality grade 304 cold rolled stainless steel sheet (2B finish).',
      },
      {
        sku: 'PRD-002',
        name: 'Aluminium 6061 Plate',
        category: 'Aluminium',
        costPricePerKg: 220.00,
        sellingPricePerKg: 285.00,
        stockKg: 280.50,
        minStockKg: 40.00,
        unit: 'kg',
        description: 'Structural alloy 6061-T6 aluminum plate with excellent corrosion resistance.',
      },
      {
        sku: 'PRD-003',
        name: 'Pure Copper Busbar C110',
        category: 'Copper',
        costPricePerKg: 740.00,
        sellingPricePerKg: 890.00,
        stockKg: 85.00,
        minStockKg: 20.00,
        unit: 'kg',
        description: 'High conductivity electrolytic tough pitch (ETP) copper busbar.',
      },
      {
        sku: 'PRD-004',
        name: 'Brass Round Rod (Grade IS 319)',
        category: 'Brass',
        costPricePerKg: 460.00,
        sellingPricePerKg: 575.00,
        stockKg: 160.00,
        minStockKg: 25.00,
        unit: 'kg',
        description: 'Free cutting brass round rod for high-speed machining and components.',
      },
      {
        sku: 'PRD-005',
        name: 'Mild Steel ERW Square Tube',
        category: 'Mild Steel',
        costPricePerKg: 62.00,
        sellingPricePerKg: 78.50,
        stockKg: 1250.00,
        minStockKg: 100.00,
        unit: 'kg',
        description: 'Standard structural mild steel ERW square tubing.',
      },
      {
        sku: 'PRD-006',
        name: 'Galvanized Iron Sheet 0.8mm',
        category: 'Galvanized Iron',
        costPricePerKg: 75.00,
        sellingPricePerKg: 94.00,
        stockKg: 8.50,
        minStockKg: 50.00,
        unit: 'kg',
        description: 'Corrosion resistant zinc-coated hot dip GI sheet.',
      },
      {
        sku: 'PRD-007',
        name: 'Titanium Grade 5 Round Bar',
        category: 'Special Alloys',
        costPricePerKg: 2100.00,
        sellingPricePerKg: 2650.00,
        stockKg: 0.00,
        minStockKg: 10.00,
        unit: 'kg',
        description: 'Ti-6Al-4V Grade 5 high strength aerospace titanium alloy rod.',
      },
    ];

    for (const p of productsToSeed) {
      await prisma.product.create({ data: p });
    }
    console.log(`✓ Seeded ${productsToSeed.length} default products.`);
  } else {
    console.log(`ℹ Products already exist (${productsCount} records).`);
  }

  // Seed initial Sales / Invoices
  const salesCount = await prisma.sale.count();
  if (salesCount === 0) {
    const contacts = await prisma.contact.findMany();
    const products = await prisma.product.findMany();

    const john = contacts.find(c => c.contactName === 'John Smith') || contacts[0];
    const sarah = contacts.find(c => c.contactName === 'Sarah Johnson') || contacts[1];
    const priya = contacts.find(c => c.contactName === 'Priya Sharma') || contacts[2];
    const michael = contacts.find(c => c.contactName === 'Michael Chen') || contacts[3];

    const ss304 = products.find(p => p.sku === 'PRD-001') || products[0];
    const al6061 = products.find(p => p.sku === 'PRD-002') || products[1];
    const copper = products.find(p => p.sku === 'PRD-003') || products[2];
    const brass = products.find(p => p.sku === 'PRD-004') || products[3];
    const msPipe = products.find(p => p.sku === 'PRD-005') || products[4];
    const giSheet = products.find(p => p.sku === 'PRD-006') || products[5];

    // Sale 1: PARTIAL
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026025',
        date: new Date('2026-10-01'),
        dueDate: new Date('2026-10-15'),
        customerId: john?.id,
        customerName: john?.contactName || 'John Smith',
        customerCompany: john?.companyName || 'Acme Corp',
        customerEmail: john?.email || 'john@acme.com',
        customerPhone: john?.phone || '+91 98765 43211',
        customerAddress: john?.address || '123 Industrial Way, Sector 4, 560001',
        status: SaleStatus.PARTIAL,
        subtotal: 19605.00,
        discount: 0.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 19605.00,
        received: 10000.00,
        balance: 9605.00,
        notes: 'Payment terms: 15 days. Delivery via standard road freight.',
        items: {
          create: [
            {
              productId: ss304?.id,
              name: ss304?.name || 'Stainless Steel 304 Sheet',
              quantityKg: 50.00,
              unitPrice: 345.00,
              total: 17250.00,
            },
            {
              productId: msPipe?.id,
              name: msPipe?.name || 'Mild Steel ERW Square Tube',
              quantityKg: 30.00,
              unitPrice: 78.50,
              total: 2355.00,
            },
          ],
        },
        payments: {
          create: [
            {
              ref: 'PAY-045',
              date: new Date('2026-10-05'),
              amount: 10000.00,
              method: 'Bank Transfer',
              notes: 'Initial advance received via NEFT',
            },
          ],
        },
      },
    });

    // Sale 2: PAID
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026024',
        date: new Date('2026-10-02'),
        dueDate: new Date('2026-10-16'),
        customerId: sarah?.id,
        customerName: sarah?.contactName || 'Sarah Johnson',
        customerCompany: sarah?.companyName || 'TechCorp Solutions',
        customerEmail: sarah?.email || 'sarah@techcorp.io',
        customerPhone: sarah?.phone || '+91 98765 43212',
        customerAddress: sarah?.address || '456 Tech Park, Electronic City, 560100',
        status: SaleStatus.PAID,
        subtotal: 53400.00,
        discount: 0.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 53400.00,
        received: 53400.00,
        balance: 0.00,
        notes: 'Full payment cleared online.',
        items: {
          create: [
            {
              productId: copper?.id,
              name: copper?.name || 'Pure Copper Busbar C110',
              quantityKg: 60.00,
              unitPrice: 890.00,
              total: 53400.00,
            },
          ],
        },
        payments: {
          create: [
            {
              ref: 'PAY-042',
              date: new Date('2026-10-10'),
              amount: 53400.00,
              method: 'Credit Card',
              notes: 'Full payment via corporate card',
            },
          ],
        },
      },
    });

    // Sale 3: OVERDUE
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026023',
        date: new Date('2026-09-20'),
        dueDate: new Date('2026-10-05'),
        customerId: priya?.id,
        customerName: priya?.contactName || 'Priya Sharma',
        customerCompany: priya?.companyName || 'Design Studio',
        customerEmail: priya?.email || 'priya@designstudio.in',
        customerPhone: priya?.phone || '+91 98765 43214',
        customerAddress: priya?.address || '101 Creative Avenue, Indiranagar, 560038',
        status: SaleStatus.OVERDUE,
        subtotal: 37169.00,
        discount: 0.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 37169.00,
        received: 0.00,
        balance: 37169.00,
        notes: 'First reminder sent on 10 Oct 2026.',
        items: {
          create: [
            {
              productId: brass?.id,
              name: brass?.name || 'Brass Round Rod (Grade IS 319)',
              quantityKg: 60.00,
              unitPrice: 575.00,
              total: 34500.00,
            },
            {
              productId: msPipe?.id,
              name: msPipe?.name || 'Mild Steel ERW Square Tube',
              quantityKg: 34.00,
              unitPrice: 78.50,
              total: 2669.00,
            },
          ],
        },
      },
    });

    // Sale 4: PAID (with discount)
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026022',
        date: new Date('2026-10-10'),
        dueDate: new Date('2026-10-24'),
        customerId: john?.id,
        customerName: john?.contactName || 'John Smith',
        customerCompany: john?.companyName || 'Acme Corp',
        customerEmail: john?.email || 'john@acme.com',
        customerPhone: john?.phone || '+91 98765 43211',
        customerAddress: john?.address || '123 Industrial Way, Sector 4, 560001',
        status: SaleStatus.PAID,
        subtotal: 14250.00,
        discount: 250.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 14000.00,
        received: 14000.00,
        balance: 0.00,
        notes: 'Early payment cash discount applied.',
        items: {
          create: [
            {
              productId: al6061?.id,
              name: al6061?.name || 'Aluminium 6061 Plate',
              quantityKg: 50.00,
              unitPrice: 285.00,
              total: 14250.00,
            },
          ],
        },
        payments: {
          create: [
            {
              ref: 'PAY-031',
              date: new Date('2026-10-12'),
              amount: 14000.00,
              method: 'Cash',
              notes: 'Cash received at front desk',
            },
          ],
        },
      },
    });

    // Sale 5: UNPAID
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026026',
        date: new Date('2026-10-08'),
        dueDate: new Date('2026-10-22'),
        customerId: sarah?.id,
        customerName: sarah?.contactName || 'Sarah Johnson',
        customerCompany: sarah?.companyName || 'TechCorp Solutions',
        customerEmail: sarah?.email || 'sarah@techcorp.io',
        customerPhone: sarah?.phone || '+91 98765 43212',
        customerAddress: sarah?.address || '456 Tech Park, Electronic City, 560100',
        status: SaleStatus.UNPAID,
        subtotal: 11750.00,
        discount: 0.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 11750.00,
        received: 0.00,
        balance: 11750.00,
        notes: 'Invoice sent via email.',
        items: {
          create: [
            {
              productId: giSheet?.id,
              name: giSheet?.name || 'Galvanized Iron Sheet 0.8mm',
              quantityKg: 125.00,
              unitPrice: 94.00,
              total: 11750.00,
            },
          ],
        },
      },
    });

    // Sale 6: DRAFT
    await prisma.sale.create({
      data: {
        ref: 'SALE-2026027',
        date: new Date('2026-10-09'),
        dueDate: new Date('2026-10-23'),
        customerId: michael?.id,
        customerName: michael?.contactName || 'Michael Chen',
        customerCompany: michael?.companyName || 'Global Logistics',
        customerEmail: michael?.email || 'michael@globallogistics.com',
        customerPhone: michael?.phone || '+91 98765 43213',
        customerAddress: michael?.address || '789 Logistics Hub, Port Area, 560025',
        status: SaleStatus.DRAFT,
        subtotal: 7850.00,
        discount: 0.00,
        tax: 0.00,
        taxPercent: 0.00,
        total: 7850.00,
        received: 0.00,
        balance: 7850.00,
        notes: 'Draft quotation awaiting customer purchase order.',
        items: {
          create: [
            {
              productId: msPipe?.id,
              name: msPipe?.name || 'Mild Steel ERW Square Tube',
              quantityKg: 100.00,
              unitPrice: 78.50,
              total: 7850.00,
            },
          ],
        },
      },
    });

    console.log('✓ Seeded 6 default sales invoices with line items and payments.');
  } else {
    console.log(`ℹ Sales already exist (${salesCount} records).`);
  }

  // Seed initial purchases if empty
  const purchasesCount = await prisma.purchase.count();
  if (purchasesCount === 0) {
    const industrial = await prisma.contact.findFirst({ where: { contactName: 'Robert Taylor' } });
    const apex = await prisma.contact.findFirst({ where: { contactName: 'David Wilson' } });
    const prime = await prisma.contact.findFirst({ where: { contactName: 'Sarah Johnson' } });

    const ss304 = await prisma.product.findFirst({ where: { sku: 'SS-304-SHT' } });
    const msPipe = await prisma.product.findFirst({ where: { sku: 'MS-PIPE-SQ' } });
    const aluPlate = await prisma.product.findFirst({ where: { sku: 'ALU-6061-PLT' } });

    // Purchase 1: PARTIALLY_RECEIVED with GRN receipt and bill
    await prisma.purchase.create({
      data: {
        ref: 'PO-2026-001',
        date: new Date('2026-10-01'),
        expectedDeliveryDate: new Date('2026-10-15'),
        supplierId: industrial?.id,
        supplierName: industrial?.contactName || 'Robert Taylor',
        supplierCompany: industrial?.companyName || 'Industrial Supplies Inc',
        supplierEmail: industrial?.email || 'robert@industrialsupplies.com',
        supplierPhone: industrial?.phone || '+91 98765 43214',
        supplierAddress: industrial?.address || '101 Factory Road, Industrial Area, 560058',
        status: PurchaseStatus.PARTIALLY_RECEIVED,
        subtotal: 125000.00,
        discount: 0.00,
        tax: 6250.00,
        taxPercent: 5.00,
        total: 131250.00,
        paid: 50000.00,
        balance: 81250.00,
        notes: 'Delivery expected in batches. Material test certificates required.',
        items: {
          create: [
            {
              productId: ss304?.id,
              name: ss304?.name || 'Stainless Steel 304 Sheet (2mm)',
              orderedKg: 300.00,
              receivedKg: 200.00,
              billedKg: 200.00,
              unitPrice: 280.00,
              total: 84000.00,
            },
            {
              productId: msPipe?.id,
              name: msPipe?.name || 'Mild Steel ERW Square Tube',
              orderedKg: 600.00,
              receivedKg: 600.00,
              billedKg: 600.00,
              unitPrice: 68.33,
              total: 41000.00,
            },
          ],
        },
        receipts: {
          create: [
            {
              ref: 'GRN-001',
              date: new Date('2026-10-04'),
              itemsReceived: 800.00,
              status: 'Received',
              notes: 'Batch 1 received and inspected at warehouse.',
            },
          ],
        },
        bills: {
          create: [
            {
              ref: 'BILL-001',
              date: new Date('2026-10-05'),
              dueDate: new Date('2026-10-20'),
              amount: 131250.00,
              paid: 50000.00,
              balance: 81250.00,
              status: 'PARTIAL',
              notes: 'Bill for Batch 1 delivery.',
            },
          ],
        },
        payments: {
          create: [
            {
              ref: 'PAY-OUT-001',
              date: new Date('2026-10-06'),
              amount: 50000.00,
              method: 'Bank Transfer',
              notes: 'Advance payment for Batch 1',
              voided: false,
            },
          ],
        },
      },
    });

    // Purchase 2: ORDERED
    await prisma.purchase.create({
      data: {
        ref: 'PO-2026-002',
        date: new Date('2026-10-05'),
        expectedDeliveryDate: new Date('2026-10-18'),
        supplierId: apex?.id,
        supplierName: apex?.contactName || 'David Wilson',
        supplierCompany: apex?.companyName || 'Apex Logistics Ltd',
        supplierEmail: apex?.email || 'david@apexlogistics.com',
        supplierPhone: apex?.phone || '+91 98765 43217',
        supplierAddress: apex?.address || '808 Transit Park, Airport Road, 560030',
        status: PurchaseStatus.ORDERED,
        subtotal: 54000.00,
        discount: 0.00,
        tax: 2700.00,
        taxPercent: 5.00,
        total: 56700.00,
        paid: 0.00,
        balance: 56700.00,
        notes: 'Standard purchase order confirmed with vendor.',
        items: {
          create: [
            {
              productId: aluPlate?.id,
              name: aluPlate?.name || 'Aluminum 6061 Plate (10mm)',
              orderedKg: 150.00,
              receivedKg: 0.00,
              billedKg: 0.00,
              unitPrice: 360.00,
              total: 54000.00,
            },
          ],
        },
      },
    });

    // Purchase 3: COMPLETED
    await prisma.purchase.create({
      data: {
        ref: 'PO-2026-003',
        date: new Date('2026-09-20'),
        expectedDeliveryDate: new Date('2026-09-28'),
        supplierId: industrial?.id,
        supplierName: industrial?.contactName || 'Robert Taylor',
        supplierCompany: industrial?.companyName || 'Industrial Supplies Inc',
        supplierEmail: industrial?.email || 'robert@industrialsupplies.com',
        supplierPhone: industrial?.phone || '+91 98765 43214',
        supplierAddress: industrial?.address || '101 Factory Road, Industrial Area, 560058',
        status: PurchaseStatus.COMPLETED,
        subtotal: 42000.00,
        discount: 0.00,
        tax: 2100.00,
        taxPercent: 5.00,
        total: 44100.00,
        paid: 44100.00,
        balance: 0.00,
        notes: 'Order fully received and payment settled in full.',
        items: {
          create: [
            {
              productId: ss304?.id,
              name: ss304?.name || 'Stainless Steel 304 Sheet (2mm)',
              orderedKg: 150.00,
              receivedKg: 150.00,
              billedKg: 150.00,
              unitPrice: 280.00,
              total: 42000.00,
            },
          ],
        },
        receipts: {
          create: [
            {
              ref: 'GRN-002',
              date: new Date('2026-09-26'),
              itemsReceived: 150.00,
              status: 'Received',
              notes: 'Full quantity received.',
            },
          ],
        },
        bills: {
          create: [
            {
              ref: 'BILL-002',
              date: new Date('2026-09-27'),
              dueDate: new Date('2026-10-10'),
              amount: 44100.00,
              paid: 44100.00,
              balance: 0.00,
              status: 'PAID',
              notes: 'Full invoice paid.',
            },
          ],
        },
        payments: {
          create: [
            {
              ref: 'PAY-OUT-002',
              date: new Date('2026-10-02'),
              amount: 44100.00,
              method: 'NEFT Transfer',
              notes: 'Full settlement for BILL-002',
              voided: false,
            },
          ],
        },
      },
    });

    // Purchase 4: DRAFT
    await prisma.purchase.create({
      data: {
        ref: 'PO-2026-004',
        date: new Date('2026-10-12'),
        expectedDeliveryDate: new Date('2026-10-25'),
        supplierId: prime?.id,
        supplierName: prime?.contactName || 'Sarah Johnson',
        supplierCompany: prime?.companyName || 'Prime Hardware Supplies',
        supplierEmail: prime?.email || 'sarah@primehardware.com',
        supplierPhone: prime?.phone || '+91 98765 43211',
        supplierAddress: prime?.address || '456 Industrial Estate, Sector 5, 560066',
        status: PurchaseStatus.DRAFT,
        subtotal: 18500.00,
        discount: 0.00,
        tax: 925.00,
        taxPercent: 5.00,
        total: 19425.00,
        paid: 0.00,
        balance: 19425.00,
        notes: 'Draft requisition pending manager sign-off.',
        items: {
          create: [
            {
              productId: msPipe?.id,
              name: msPipe?.name || 'Mild Steel ERW Square Tube',
              orderedKg: 250.00,
              receivedKg: 0.00,
              billedKg: 0.00,
              unitPrice: 74.00,
              total: 18500.00,
            },
          ],
        },
      },
    });

    console.log('✓ Seeded 4 default purchase orders with line items, receipts, bills, and payments.');
  } else {
    console.log(`ℹ Purchases already exist (${purchasesCount} records).`);
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
