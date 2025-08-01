#!/usr/bin/env node

/**
 * Test Data Seeder
 * Seeds database with sample data for testing and demonstration
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    const vcUser = await prisma.user.create({
      data: {
        email: 'vc@example.com',
        password: hashedPassword,
        firstName: 'Victoria',
        lastName: 'Capital',
        userType: 'VC',
        companyName: 'Elite Ventures'
      }
    });

    const investorUser = await prisma.user.create({
      data: {
        email: 'investor@example.com',
        password: hashedPassword,
        firstName: 'Isaac',
        lastName: 'Investor',
        userType: 'INVESTOR',
        companyName: 'Smart Investments LLC'
      }
    });

    console.log('   ✅ Created test users');

    // Create sample constraints
    const constraints = [
      {
        name: 'High Revenue Growth',
        description: 'Companies with revenue growth rate above 20%',
        metric: 'revenue_growth_rate',
        operator: 'gt',
        value: '0.20',
        priority: 'HIGH',
        tags: ['growth', 'revenue'],
        userId: vcUser.id
      },
      {
        name: 'Minimum Employee Count',
        description: 'Companies with at least 10 employees',
        metric: 'employee_count',
        operator: 'gte',
        value: '10',
        priority: 'MEDIUM',
        tags: ['scale', 'team'],
        userId: vcUser.id
      },
      {
        name: 'Profitable Companies',
        description: 'Companies with positive profit margins',
        metric: 'profit_margin',
        operator: 'gt',
        value: '0',
        priority: 'HIGH',
        tags: ['profitability'],
        userId: investorUser.id
      }
    ];

    for (const constraintData of constraints) {
      await prisma.constraint.create({
        data: constraintData
      });
    }

    console.log('   ✅ Created sample constraints');

    // Create sample documents
    const documents = [
      {
        filename: 'sample-financials-2024.pdf',
        originalFilename: 'Q4-2024-Financial-Report.pdf',
        fileType: 'application/pdf',
        fileSize: 2048576,
        status: 'PROCESSED',
        extractedMetrics: {
          revenue: 5000000,
          revenue_growth_rate: 0.25,
          employee_count: 45,
          profit_margin: 0.15
        },
        userId: vcUser.id
      },
      {
        filename: 'startup-metrics.csv',
        originalFilename: 'startup-performance-metrics.csv',
        fileType: 'text/csv',
        fileSize: 1024000,
        status: 'PROCESSED',
        extractedMetrics: {
          revenue: 1200000,
          revenue_growth_rate: 0.45,
          employee_count: 8,
          profit_margin: -0.05
        },
        userId: investorUser.id
      }
    ];

    for (const docData of documents) {
      await prisma.document.create({
        data: docData
      });
    }

    console.log('   ✅ Created sample documents');

    // Create constraint templates
    const templates = [
      {
        name: 'Standard VC Due Diligence',
        description: 'Common constraints used by VCs for due diligence',
        constraints: [
          {
            name: 'Revenue Threshold',
            description: 'Minimum annual revenue',
            metric: 'annual_revenue',
            operator: 'gte',
            value: '1000000',
            priority: 'HIGH'
          },
          {
            name: 'Growth Rate',
            description: 'Year-over-year growth rate',
            metric: 'yoy_growth',
            operator: 'gte',
            value: '0.30',
            priority: 'CRITICAL'
          }
        ]
      },
      {
        name: 'Stock Investor Screening',
        description: 'Standard screening criteria for stock investors',
        constraints: [
          {
            name: 'P/E Ratio',
            description: 'Price to earnings ratio threshold',
            metric: 'pe_ratio',
            operator: 'lte',
            value: '25',
            priority: 'MEDIUM'
          },
          {
            name: 'Debt to Equity',
            description: 'Maximum debt to equity ratio',
            metric: 'debt_to_equity',
            operator: 'lte',
            value: '0.6',
            priority: 'HIGH'
          }
        ]
      }
    ];

    for (const templateData of templates) {
      await prisma.constraintTemplate.create({
        data: templateData
      });
    }

    console.log('   ✅ Created constraint templates');

    console.log('\n🎉 Test data seeding completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log(`   • Users: 2 (1 VC, 1 Investor)`);
    console.log(`   • Constraints: ${constraints.length}`);
    console.log(`   • Documents: ${documents.length}`);
    console.log(`   • Templates: ${templates.length}`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('   VC User: vc@example.com / TestPassword123!');
    console.log('   Investor: investor@example.com / TestPassword123!');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTestData().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seedTestData;
