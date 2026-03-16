#!/usr/bin/env node

/**
 * Development health check script
 * Run this to verify your Next.js setup is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Next.js setup health...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  '.env.development',
  'src/lib/api.ts',
  'src/contexts/AuthContext.tsx',
  'src/styles/globals.css'
];

const missingFiles = [];
const existingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    existingFiles.push(file);
  } else {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');
} else {
  console.log('✅ All required files present');
}

// Check package.json dependencies
let missingDeps = [];
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    'tailwindcss',
    'typescript'
  ];
  
  missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!deps[dep] && !devDeps[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    console.log('⚠️  Missing dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
  } else {
    console.log('✅ All required dependencies installed');
  }
} catch (error) {
  console.log('❌ Could not read package.json');
  missingDeps = requiredDeps; // Assume all are missing if we can't read
}

// Check environment configuration
if (fs.existsSync('.env.development')) {
  const envContent = fs.readFileSync('.env.development', 'utf8');
  if (envContent.includes('NEXT_PUBLIC_API_URL')) {
    console.log('✅ Development environment configured');
  } else {
    console.log('⚠️  Development environment file exists but may be incomplete');
  }
} else {
  console.log('⚠️  No .env.development file found');
}

// Check TypeScript configuration
if (fs.existsSync('tsconfig.json')) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    if (tsConfig.compilerOptions?.target === 'ES2020') {
      console.log('✅ TypeScript configured for modern ES2020');
    } else {
      console.log('⚠️  TypeScript target may be outdated');
    }
  } catch (error) {
    console.log('❌ Could not read tsconfig.json');
  }
}

// Check Next.js configuration
if (fs.existsSync('next.config.js')) {
  const nextConfigContent = fs.readFileSync('next.config.js', 'utf8');
  if (nextConfigContent.includes('turbopack')) {
    console.log('⚠️  Turbopack configuration found - consider removing if not needed');
  } else {
    console.log('✅ Next.js configuration looks clean');
  }
}

console.log('\n📋 Summary:');
console.log(`   Files checked: ${existingFiles.length}/${requiredFiles.length}`);
console.log(`   Dependencies: ${missingDeps.length === 0 ? 'OK' : 'Missing some'}`);
console.log(`   Environment: ${fs.existsSync('.env.development') ? 'Configured' : 'Not configured'}`);

if (missingFiles.length === 0 && missingDeps.length === 0) {
  console.log('\n🎉 Your Next.js setup looks healthy!');
  console.log('\nNext steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Make sure your API server is running on http://localhost:8000');
  console.log('3. Check the browser console for any runtime errors');
} else {
  console.log('\n🔧 Please address the issues above before proceeding.');
}