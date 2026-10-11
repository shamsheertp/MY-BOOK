import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';

export const updateCompanyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  tagline: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  email: z.string().email('Invalid email address').or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountHolder: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  ifsc: z.string().nullable().optional(),
  upiId: z.string().nullable().optional(),
  invoiceTerms: z.string().nullable().optional(),
  footerNote: z.string().nullable().optional(),
  signatoryName: z.string().nullable().optional(),
  showBankOnInvoice: z.boolean().optional(),
});

export const getCompanyProfile = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let profile = await prisma.companyProfile.findFirst();

    if (!profile) {
      // Create initial profile if not yet created
      profile = await prisma.companyProfile.create({
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
    }

    res.json({
      success: true,
      data: { companyProfile: profile },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompanyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    let profile = await prisma.companyProfile.findFirst();

    if (profile) {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          companyName: data.companyName !== undefined ? data.companyName : profile.companyName,
          tagline: data.tagline !== undefined ? data.tagline : profile.tagline,
          logo: data.logo !== undefined ? data.logo : profile.logo,
          email: data.email !== undefined ? data.email : profile.email,
          phone: data.phone !== undefined ? data.phone : profile.phone,
          website: data.website !== undefined ? data.website : profile.website,
          addressLine1: data.addressLine1 !== undefined ? data.addressLine1 : profile.addressLine1,
          addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : profile.addressLine2,
          city: data.city !== undefined ? data.city : profile.city,
          state: data.state !== undefined ? data.state : profile.state,
          pincode: data.pincode !== undefined ? data.pincode : profile.pincode,
          country: data.country !== undefined ? data.country : profile.country,
          gstin: data.gstin !== undefined ? data.gstin : profile.gstin,
          pan: data.pan !== undefined ? data.pan : profile.pan,
          bankName: data.bankName !== undefined ? data.bankName : profile.bankName,
          accountHolder: data.accountHolder !== undefined ? data.accountHolder : profile.accountHolder,
          accountNumber: data.accountNumber !== undefined ? data.accountNumber : profile.accountNumber,
          ifsc: data.ifsc !== undefined ? data.ifsc : profile.ifsc,
          upiId: data.upiId !== undefined ? data.upiId : profile.upiId,
          invoiceTerms: data.invoiceTerms !== undefined ? data.invoiceTerms : profile.invoiceTerms,
          footerNote: data.footerNote !== undefined ? data.footerNote : profile.footerNote,
          signatoryName: data.signatoryName !== undefined ? data.signatoryName : profile.signatoryName,
          showBankOnInvoice: data.showBankOnInvoice !== undefined ? data.showBankOnInvoice : profile.showBankOnInvoice,
        },
      });
    } else {
      profile = await prisma.companyProfile.create({
        data: {
          companyName: data.companyName || 'Capital Metal Craft',
          tagline: data.tagline ?? null,
          logo: data.logo ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          pincode: data.pincode ?? null,
          country: data.country ?? 'India',
          gstin: data.gstin ?? null,
          pan: data.pan ?? null,
          bankName: data.bankName ?? null,
          accountHolder: data.accountHolder ?? null,
          accountNumber: data.accountNumber ?? null,
          ifsc: data.ifsc ?? null,
          upiId: data.upiId ?? null,
          invoiceTerms: data.invoiceTerms ?? null,
          footerNote: data.footerNote ?? null,
          signatoryName: data.signatoryName ?? null,
          showBankOnInvoice: data.showBankOnInvoice !== undefined ? data.showBankOnInvoice : true,
        },
      });
    }

    res.json({
      success: true,
      message: 'Company profile updated successfully.',
      data: { companyProfile: profile },
    });
  } catch (error) {
    next(error);
  }
};
