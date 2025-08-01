import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const vcUser = await prisma.user.upsert({
    where: { email: 'vc@example.com' },
    update: {},
    create: {
      email: 'vc@example.com',
      name: 'John VC',
      password: hashedPassword,
      userType: 'VC',
    },
  });

  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      email: 'investor@example.com',
      name: 'Jane Investor',
      password: hashedPassword,
      userType: 'INVESTOR',
    },
  });

  console.log('✅ Created users:', { vcUser: vcUser.email, investorUser: investorUser.email });

  // Create sample companies
  const company1 = await prisma.company.create({
    data: {
      name: 'TechCorp Inc.',
      ticker: 'TECH',
      sector: 'Technology',
      description: 'A leading technology company',
      userId: vcUser.id,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'Apple Inc.',
      ticker: 'AAPL',
      sector: 'Technology',
      description: 'Consumer electronics and software',
      userId: investorUser.id,
    },
  });

  console.log('✅ Created companies:', { company1: company1.name, company2: company2.name });

  // Create constraint templates
  const vcTemplate = await prisma.constraintTemplate.create({
    data: {
      name: 'VC Due Diligence',
      description: 'Standard constraints for VC portfolio companies',
      userType: 'VC',
      isPublic: true,
      createdBy: vcUser.id,
      constraints: [
        {
          name: 'High Burn Rate Alert',
          metric: 'burn_rate',
          operator: 'GREATER_THAN',
          value: 500000,
          severity: 'CRITICAL',
          message: 'Monthly burn rate exceeds $500K - requires immediate attention',
          isActive: true,
        },
        {
          name: 'Low Revenue Growth',
          metric: 'revenue_growth_yoy',
          operator: 'LESS_THAN',
          value: 0.5,
          severity: 'WARNING',
          message: 'YoY revenue growth below 50% - monitor closely',
          isActive: true,
        },
        {
          name: 'Runway Alert',
          metric: 'runway_months',
          operator: 'LESS_THAN',
          value: 12,
          severity: 'CRITICAL',
          message: 'Cash runway less than 12 months - fundraising needed',
          isActive: true,
        },
      ],
    },
  });

  const investorTemplate = await prisma.constraintTemplate.create({
    data: {
      name: 'Value Investor Screening',
      description: 'Benjamin Graham style value investing constraints',
      userType: 'INVESTOR',
      isPublic: true,
      createdBy: investorUser.id,
      constraints: [
        {
          name: 'High P/E Warning',
          metric: 'pe_ratio',
          operator: 'GREATER_THAN',
          value: 20,
          severity: 'WARNING',
          message: 'P/E ratio above 20 - may be overvalued',
          isActive: true,
        },
        {
          name: 'Low P/B Opportunity',
          metric: 'pb_ratio',
          operator: 'LESS_THAN',
          value: 1.5,
          severity: 'INFO',
          message: 'P/B ratio below 1.5 - potential value opportunity',
          isActive: true,
        },
        {
          name: 'High Debt Risk',
          metric: 'debt_to_equity',
          operator: 'GREATER_THAN',
          value: 2,
          severity: 'CRITICAL',
          message: 'Debt-to-equity ratio above 2 - high financial risk',
          isActive: true,
        },
      ],
    },
  });

  console.log('✅ Created constraint templates:', { 
    vcTemplate: vcTemplate.name, 
    investorTemplate: investorTemplate.name 
  });

  // Create sample constraints for users
  const constraint1 = await prisma.constraint.create({
    data: {
      name: 'Revenue Growth Check',
      description: 'Monitor quarterly revenue growth',
      metric: 'revenue_growth_qoq',
      operator: 'LESS_THAN',
      value: 0.1,
      severity: 'WARNING',
      message: 'Quarterly revenue growth below 10%',
      userId: vcUser.id,
    },
  });

  const constraint2 = await prisma.constraint.create({
    data: {
      name: 'P/E Ratio Alert',
      description: 'Alert when P/E ratio is too high',
      metric: 'pe_ratio',
      operator: 'GREATER_THAN',
      value: 25,
      severity: 'WARNING',
      message: 'P/E ratio exceeds 25 - overvaluation risk',
      userId: investorUser.id,
    },
  });

  console.log('✅ Created constraints:', { 
    constraint1: constraint1.name, 
    constraint2: constraint2.name 
  });

  console.log('🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });