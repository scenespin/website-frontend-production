/**
 * Test script for content generation prompts
 * Tests "her computer explodes" example to ensure it generates screenplay content, not analysis
 */

import { buildChatContentPrompt, detectContentRequest } from './utils/promptBuilders.js';

// Test configuration
const TEST_MESSAGE = "her computer explodes";
const TEST_SCENE_CONTEXT = {
  heading: "INT. NEWS OFFICE - NIGHT",
  act: "Act 1",
  characters: ["SARAH"],
  pageNumber: 5,
  totalPages: 120
};

// Available models to test
const MODELS_TO_TEST = [
  'claude-sonnet-4-5-20250929',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet-20241022',
  'gemini-2.0-flash-001'
];

// Analysis indicators (if response contains these, it's giving advice, not content)
const ANALYSIS_INDICATORS = [
  /analysis/i,
  /suggestion/i,
  /recommend/i,
  /consider/i,
  /alternative/i,
  /problem/i,
  /issue/i,
  /would be/i,
  /could be/i,
  /might be/i,
  /this creates/i,
  /this would/i,
  /this could/i,
  /tonal/i,
  /logic problem/i,
  /story impact/i,
  /if you want/i,
  /would you like/i
];

// Screenplay content indicators (good signs)
const SCREENPLAY_INDICATORS = [
  /^(INT\.|EXT\.|I\/E\.)/i, // Scene heading (though we don't want these)
  /^[A-Z][A-Z\s#0-9']+$/, // Character name in ALL CAPS
  /[A-Z][a-z]+.*\.$/, // Action line (capitalized sentence)
  /explodes/i,
  /sparks/i,
  /flames/i,
  /smoke/i
];

function isAnalysis(response) {
  const lowerResponse = response.toLowerCase();
  return ANALYSIS_INDICATORS.some(pattern => pattern.test(response));
}

function isScreenplayContent(response) {
  const lines = response.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Check if it has screenplay structure
  const hasCharacterName = lines.some(line => /^[A-Z][A-Z\s#0-9']+$/.test(line) && line.length > 2);
  const hasActionLine = lines.some(line => 
    !/^(INT\.|EXT\.|I\/E\.)/i.test(line) && // Not a scene heading
    !/^[A-Z][A-Z\s#0-9']+$/.test(line) && // Not a character name
    !/^\(/.test(line) && // Not a parenthetical
    line.length > 10 && // Has some substance
    /^[A-Z]/.test(line) // Starts with capital
  );
  
  // Should NOT have analysis language
  const hasNoAnalysis = !isAnalysis(response);
  
  return (hasCharacterName || hasActionLine) && hasNoAnalysis;
}

async function testWithModel(modelId, iteration) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing Model: ${modelId} (Iteration ${iteration})`);
  console.log(`${'='.repeat(80)}`);
  
  // Check detection
  const isContent = detectContentRequest(TEST_MESSAGE);
  console.log(`\n✓ Detection: ${isContent ? 'CONTENT REQUEST' : 'ADVICE REQUEST'}`);
  
  if (!isContent) {
    console.log('❌ ERROR: Detection failed! Should be content request.');
    return { success: false, error: 'Detection failed' };
  }
  
  // Build prompt
  const userPrompt = buildChatContentPrompt(TEST_MESSAGE, TEST_SCENE_CONTEXT);
  const systemPrompt = `You are a professional screenwriting assistant. The user wants you to WRITE SCREENPLAY CONTENT, not analyze or critique. Write only the screenplay content they requested - no explanations, no suggestions, no alternatives.`;
  
  console.log(`\n📝 System Prompt:\n${systemPrompt}`);
  console.log(`\n📝 User Prompt (first 500 chars):\n${userPrompt.substring(0, 500)}...`);
  
  // Call API (you'll need to set up API_URL and auth)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    // For now, we'll simulate or you can add actual API call
    // This is a template - you'll need to add actual API credentials
    console.log(`\n⚠️  Note: Add actual API call here with auth token`);
    console.log(`   API Endpoint: ${API_URL}/api/chat/generate`);
    console.log(`   Model: ${modelId}`);
    
    // TODO: Add actual API call
    // const response = await fetch(`${API_URL}/api/chat/generate`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${AUTH_TOKEN}`
    //   },
    //   body: JSON.stringify({
    //     userPrompt,
    //     systemPrompt,
    //     desiredModelId: modelId,
    //     conversationHistory: []
    //   })
    // });
    
    // For testing, return a mock response structure
    return {
      success: true,
      modelId,
      iteration,
      userPrompt,
      systemPrompt,
      needsActualAPICall: true
    };
    
  } catch (error) {
    console.error(`❌ Error testing model ${modelId}:`, error);
    return { success: false, error: error.message, modelId };
  }
}

async function runTests() {
  console.log('\n🧪 PROMPT CONTENT GENERATION TEST');
  console.log('='.repeat(80));
  console.log(`Test Message: "${TEST_MESSAGE}"`);
  console.log(`Expected: Screenplay content (action lines about computer exploding)`);
  console.log(`NOT Expected: Analysis, suggestions, or critique`);
  console.log('='.repeat(80));
  
  const results = [];
  const ITERATIONS_PER_MODEL = 3;
  
  for (const modelId of MODELS_TO_TEST) {
    for (let i = 1; i <= ITERATIONS_PER_MODEL; i++) {
      const result = await testWithModel(modelId, i);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total tests: ${results.length}`);
  console.log(`Models tested: ${MODELS_TO_TEST.length}`);
  console.log(`Iterations per model: ${ITERATIONS_PER_MODEL}`);
  console.log(`\n⚠️  Note: This script needs actual API calls to be added for full testing.`);
  console.log(`   Add your API URL and auth token to test with real models.`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testWithModel, isAnalysis, isScreenplayContent, runTests };

