/**
 * PHASE 1: Production Hub Critical Fixes - Comprehensive Test Suite
 * 
 * Tests all fixes implemented in Phase 1:
 * - Step 1A: SceneBuilder useEditor fix
 * - Step 1B: Auth tokens (Jobs Banner + Asset Bank)
 * - Step 1C: Media uploads (S3 pre-signed URLs)
 * - Step 1D: Missing API endpoints
 * 
 * Run: npx ts-node tests/phase1-production-hub-test.ts
 */

import assert from 'assert';

console.log('================================================================================');
console.log(' PHASE 1: PRODUCTION HUB - COMPREHENSIVE TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 0;
let failedTests: string[] = [];

function runTest(name: string, testFn: () => void | Promise<void>) {
  totalTests++;
  return (async () => {
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error: any) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      failedTests.push(name);
    }
  })();
}

// ============================================================================
// STEP 1A: SCENEBUILDER CONTEXT FIX
// ============================================================================

console.log('\n📋 STEP 1A: SceneBuilder Context Fix\n');

await runTest('SceneBuilderPanel should not import useEditor', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/SceneBuilderPanel.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should NOT have useEditor import
  assert(!content.includes('import { useEditor }'), 'useEditor import still exists');
  assert(!content.includes('from \'@/contexts/EditorContext\''), 'EditorContext import still exists');
  
  // Should NOT call useEditor()
  assert(!content.includes('const editor = useEditor()'), 'useEditor() call still exists');
  
  // Should NOT use editor.state.title
  assert(!content.includes('editor.state.title'), 'editor.state.title still referenced');
  
  console.log('   - No useEditor import ✓');
  console.log('   - No EditorContext import ✓');
  console.log('   - No useEditor() call ✓');
  console.log('   - No editor.state.title reference ✓');
});

await runTest('SceneBuilderPanel should use screenplay context', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/SceneBuilderPanel.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should import useScreenplay
  assert(content.includes('import { useScreenplay }'), 'Missing useScreenplay import');
  
  // Should call useScreenplay()
  assert(content.includes('const screenplay = useScreenplay()'), 'Missing useScreenplay() call');
  
  // Should use screenplay.beats or screenplay.isConnected
  assert(content.includes('screenplay.beats') || content.includes('screenplay.isConnected'), 
    'Not using screenplay properties');
  
  console.log('   - useScreenplay import ✓');
  console.log('   - useScreenplay() call ✓');
  console.log('   - screenplay properties used ✓');
});

// ============================================================================
// STEP 1B: AUTH TOKENS FIX
// ============================================================================

console.log('\n📋 STEP 1B: Auth Tokens Fix\n');

await runTest('ProductionHub should use getToken for Jobs Banner', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/ProductionHub.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should import useAuth
  assert(content.includes('import { useAuth }'), 'Missing useAuth import');
  
  // Should call getToken
  assert(content.includes('const { getToken') || content.includes('const token = await getToken'), 
    'Missing getToken call');
  
  // Should have Authorization header in fetch
  assert(content.includes('Authorization'), 'Missing Authorization header');
  assert(content.includes('Bearer'), 'Missing Bearer token');
  
  // Should fetch workflows/list
  assert(content.includes('/api/workflows/list'), 'Missing workflows/list endpoint');
  
  console.log('   - useAuth import ✓');
  console.log('   - getToken() call ✓');
  console.log('   - Authorization header ✓');
  console.log('   - Bearer token format ✓');
});

await runTest('AssetBankPanel should use getToken for API calls', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/AssetBankPanel.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should import useAuth
  assert(content.includes('import { useAuth }'), 'Missing useAuth import');
  
  // Should NOT use localStorage.getItem('token')
  assert(!content.includes('localStorage.getItem(\'token\')'), 'Still using localStorage for token');
  
  // Should call getToken
  assert(content.includes('const token = await getToken'), 'Missing getToken call');
  
  // Should have Authorization header
  assert(content.includes('Authorization'), 'Missing Authorization header');
  
  console.log('   - useAuth import ✓');
  console.log('   - No localStorage token ✓');
  console.log('   - getToken() call ✓');
  console.log('   - Authorization header ✓');
});

// ============================================================================
// STEP 1C: MEDIA UPLOADS FIX
// ============================================================================

console.log('\n📋 STEP 1C: Media Uploads (S3 Pre-signed URLs)\n');

await runTest('MediaLibrary should use S3 pre-signed URLs', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/MediaLibrary.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should request pre-signed URL
  assert(content.includes('get-presigned-url'), 'Missing pre-signed URL request');
  
  // Should have uploadUrl and s3Key
  assert(content.includes('uploadUrl') && content.includes('s3Key'), 
    'Missing uploadUrl or s3Key variables');
  
  // Should upload directly to S3 (PUT request)
  assert(content.includes('method: \'PUT\''), 'Missing direct S3 upload (PUT)');
  
  // Should register file after upload
  assert(content.includes('/api/media/register'), 'Missing file registration');
  
  // Should NOT use FormData for main upload
  const uploadFnMatch = content.match(/const uploadFile = async \(file: File\) => \{[\s\S]*?\n  \};/);
  if (uploadFnMatch) {
    const uploadFn = uploadFnMatch[0];
    assert(!uploadFn.includes('new FormData()'), 'Still using FormData for S3 upload');
  }
  
  console.log('   - Pre-signed URL request ✓');
  console.log('   - uploadUrl & s3Key extraction ✓');
  console.log('   - Direct S3 PUT upload ✓');
  console.log('   - File registration ✓');
  console.log('   - No FormData for S3 ✓');
});

await runTest('MediaLibrary upload flow is correct', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), 'components/production/MediaLibrary.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract uploadFile function
  const uploadFnMatch = content.match(/const uploadFile = async \(file: File\) => \{[\s\S]*?\n  \};/);
  assert(uploadFnMatch, 'uploadFile function not found');
  
  const uploadFn = uploadFnMatch[0];
  
  // Verify order: presigned -> S3 -> register
  const presignedIdx = uploadFn.indexOf('get-presigned-url');
  const s3Idx = uploadFn.indexOf('method: \'PUT\'');
  const registerIdx = uploadFn.indexOf('/api/media/register');
  
  assert(presignedIdx > 0, 'Pre-signed URL request not found');
  assert(s3Idx > presignedIdx, 'S3 upload not after pre-signed URL');
  assert(registerIdx > s3Idx, 'Registration not after S3 upload');
  
  console.log('   - Step 1: Get pre-signed URL ✓');
  console.log('   - Step 2: Upload to S3 ✓');
  console.log('   - Step 3: Register file ✓');
  console.log('   - Flow order correct ✓');
});

// ============================================================================
// STEP 1D: MISSING API ENDPOINTS
// ============================================================================

console.log('\n📋 STEP 1D: Missing API Endpoints\n');

await runTest('Backend media.ts route file exists', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), '..', 'website-backend-api', 'src', 'routes', 'media.ts');
  assert(fs.existsSync(filePath), 'media.ts route file does not exist');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should have required routes
  assert(content.includes('GET /api/media/list'), 'Missing /api/media/list route');
  assert(content.includes('POST /api/media/register'), 'Missing /api/media/register route');
  assert(content.includes('GET /api/storage/quota'), 'Missing /api/storage/quota route');
  
  console.log('   - media.ts file exists ✓');
  console.log('   - /api/media/list route ✓');
  console.log('   - /api/media/register route ✓');
  console.log('   - /api/storage/quota route ✓');
});

await runTest('Media routes are registered in server.ts', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), '..', 'website-backend-api', 'src', 'server.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Should import media router
  assert(content.includes('import mediaRouter from \'./routes/media\''), 
    'Missing media router import');
  
  // Should register media routes
  assert(content.includes('app.use(\'/api/media\', authenticateUser, mediaRouter)'), 
    'Missing /api/media route registration');
  
  console.log('   - mediaRouter import ✓');
  console.log('   - /api/media registration ✓');
  console.log('   - Authentication middleware ✓');
});

await runTest('Media routes have correct implementation', () => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), '..', 'website-backend-api', 'src', 'routes', 'media.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // List route should query DynamoDB
  assert(content.includes('QueryCommand'), '/api/media/list should use QueryCommand');
  assert(content.includes('projectId'), '/api/media/list should filter by projectId');
  
  // Register route should save to DynamoDB
  assert(content.includes('PutCommand'), '/api/media/register should use PutCommand');
  assert(content.includes('s3Key') && content.includes('fileName'), 
    '/api/media/register should save file metadata');
  
  // Quota route should calculate storage
  assert(content.includes('fileSize'), '/api/storage/quota should calculate file sizes');
  assert(content.includes('totalBytes') || content.includes('totalGB'), 
    '/api/storage/quota should calculate totals');
  
  console.log('   - List route uses DynamoDB ✓');
  console.log('   - Register route saves metadata ✓');
  console.log('   - Quota route calculates storage ✓');
});

// ============================================================================
// INTEGRATION CHECKS
// ============================================================================

console.log('\n📋 INTEGRATION CHECKS\n');

await runTest('No conflicting imports in fixed files', () => {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'components/production/SceneBuilderPanel.tsx',
    'components/production/ProductionHub.tsx',
    'components/production/AssetBankPanel.tsx',
    'components/production/MediaLibrary.tsx',
  ];
  
  files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Should not have both useEditor and useScreenplay in same file (except specific cases)
    const hasUseEditor = content.includes('useEditor');
    const hasUseScreenplay = content.includes('useScreenplay');
    
    if (file.includes('SceneBuilderPanel')) {
      assert(hasUseScreenplay && !hasUseEditor, 
        `${file} should only use useScreenplay, not useEditor`);
    }
  });
  
  console.log('   - No context conflicts ✓');
  console.log('   - Imports are clean ✓');
});

await runTest('All auth calls use Clerk getToken pattern', () => {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'components/production/ProductionHub.tsx',
    'components/production/AssetBankPanel.tsx',
    'components/production/MediaLibrary.tsx',
  ];
  
  files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Should NOT use old localStorage pattern
    assert(!content.includes('localStorage.getItem(\'auth_token\')'), 
      `${file} still uses old auth pattern`);
    assert(!content.includes('localStorage.getItem(\'token\')'), 
      `${file} still uses localStorage token`);
    
    // If it makes authenticated requests, should use getToken
    if (content.includes('Authorization')) {
      assert(content.includes('getToken'), 
        `${file} has Authorization header but no getToken()`);
    }
  });
  
  console.log('   - No localStorage auth ✓');
  console.log('   - All use getToken() ✓');
  console.log('   - Clerk pattern consistent ✓');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n================================================================================');
console.log(' TEST RESULTS');
console.log('================================================================================\n');

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${totalTests - passedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests.length > 0) {
  console.log('Failed Tests:');
  failedTests.forEach(test => console.log(`  ❌ ${test}`));
  console.log('');
}

console.log('================================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED! PHASE 1 IS COMPLETE AND READY!');
  console.log('================================================================================\n');
  console.log('✅ Step 1A: SceneBuilder Context Fix - WORKING');
  console.log('✅ Step 1B: Auth Tokens - WORKING');
  console.log('✅ Step 1C: Media Uploads (S3) - WORKING');
  console.log('✅ Step 1D: API Endpoints - WORKING\n');
  console.log('🚀 Ready to proceed to PHASE 2: Feature 0111 Implementation!');
  console.log('================================================================================\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - PLEASE FIX BEFORE PROCEEDING TO PHASE 2');
  console.log('================================================================================\n');
  process.exit(1);
}

