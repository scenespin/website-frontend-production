/**
 * Quick Smoke Test: Fountain Sections and Synopses Extraction
 * 
 * Tests that sections (# Section) and synopses (= Synopsis) are correctly
 * extracted from Fountain text and mapped to scene metadata.
 */

const testFountain = `Title: Test Screenplay
Credit: Written by
Author: Test Author

# Act I - Setup

= This is the opening act where we meet the characters.

INT. COFFEE SHOP - DAY

= Sarah meets John for the first time.

SARAH
Hello, I'm Sarah.

JOHN
Nice to meet you.

# Act II - Confrontation

= The conflict escalates.

EXT. PARK - NIGHT

= A tense confrontation in the park.

SARAH
We need to talk.

JOHN
I know.
`;

// Simulate the parsing logic
function testParsing() {
    const lines = testFountain.split('\n');
    const scenes = [];
    let currentSection = null;
    let pendingSynopsis = null;
    let currentScene = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed) continue;
        
        // Detect section (# Section)
        if (/^#+\s/.test(trimmed)) {
            const sectionText = trimmed.replace(/^#+\s*/, '').trim();
            if (sectionText) {
                currentSection = sectionText;
                console.log(`✓ Section found: "${currentSection}"`);
            }
            continue;
        }
        
        // Detect synopsis (= Synopsis)
        if (/^=\s/.test(trimmed)) {
            const synopsisText = trimmed.replace(/^=\s*/, '').trim();
            if (synopsisText) {
                // Check if next non-empty line is a scene heading
                let nextNonEmptyLine = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const nextTrimmed = lines[j].trim();
                    if (nextTrimmed) {
                        nextNonEmptyLine = nextTrimmed;
                        break;
                    }
                }
                const nextIsSceneHeading = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(nextNonEmptyLine);
                
                // If we have a current scene AND next non-empty line is NOT a scene heading, apply to current scene
                // Otherwise, store as pending for next scene
                if (currentScene && !nextIsSceneHeading) {
                    currentScene.synopsis = synopsisText;
                    console.log(`✓ Synopsis (after scene): "${synopsisText}"`);
                } else {
                    pendingSynopsis = synopsisText;
                    console.log(`✓ Synopsis (pending): "${pendingSynopsis}"`);
                }
            }
            continue;
        }
        
        // Detect scene heading
        if (/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(trimmed)) {
            if (currentScene) {
                scenes.push(currentScene);
            }
            
            currentScene = {
                heading: trimmed,
                group_label: currentSection || undefined,
                synopsis: pendingSynopsis || undefined
            };
            
            console.log(`\n✓ Scene created:`);
            console.log(`  Heading: ${currentScene.heading}`);
            console.log(`  Section: ${currentScene.group_label || '(none)'}`);
            console.log(`  Synopsis: ${currentScene.synopsis || '(none)'}`);
            
            pendingSynopsis = null; // Clear after applying
            continue;
        }
    }
    
    // Save last scene
    if (currentScene) {
        scenes.push(currentScene);
    }
    
    // Final check: Print final scene states
    console.log('\n📋 Final Scene States:');
    scenes.forEach((scene, idx) => {
        console.log(`\nScene ${idx + 1}:`);
        console.log(`  Heading: ${scene.heading}`);
        console.log(`  Section: ${scene.group_label || '(none)'}`);
        console.log(`  Synopsis: ${scene.synopsis || '(none)'}`);
    });
    
    return scenes;
}

// Run test
console.log('🧪 Testing Fountain Sections and Synopses Extraction\n');
console.log('='.repeat(60));
const results = testParsing();
console.log('='.repeat(60));
console.log(`\n✅ Test Complete: ${results.length} scenes extracted\n`);

// Verify results
// Note: Synopses AFTER scene headings apply to that scene (overwrite pending synopsis)
const expectedResults = [
    { heading: 'INT. COFFEE SHOP - DAY', section: 'Act I - Setup', synopsis: 'Sarah meets John for the first time.' },
    { heading: 'EXT. PARK - NIGHT', section: 'Act II - Confrontation', synopsis: 'A tense confrontation in the park.' }
];

let passed = 0;
let failed = 0;

results.forEach((scene, index) => {
    const expected = expectedResults[index];
    if (expected) {
        const sectionMatch = scene.group_label === expected.section;
        const synopsisMatch = scene.synopsis === expected.synopsis;
        
        if (sectionMatch && synopsisMatch) {
            console.log(`✅ Scene ${index + 1}: PASSED`);
            passed++;
        } else {
            console.log(`❌ Scene ${index + 1}: FAILED`);
            console.log(`   Expected section: "${expected.section}", got: "${scene.group_label}"`);
            console.log(`   Expected synopsis: "${expected.synopsis}", got: "${scene.synopsis}"`);
            failed++;
        }
    }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

