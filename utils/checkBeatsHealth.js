/**
 * Developer Utility: Check Beats Data Health
 * 
 * Run this in browser console to diagnose beats issues
 */

console.log('🔍 BEATS HEALTH CHECK');
console.log('='.repeat(50));

// Check localStorage
const beatsJSON = localStorage.getItem('screenplay_beats_v1');
const migrationFlag = localStorage.getItem('wryda_beats_migration_v2');

console.log('\n📦 LocalStorage Status:');
console.log('  - screenplay_beats_v1:', beatsJSON ? 'EXISTS' : 'NOT FOUND');
console.log('  - wryda_beats_migration_v2:', migrationFlag || 'NOT RUN');

if (beatsJSON) {
    try {
        const beats = JSON.parse(beatsJSON);
        console.log('\n📊 Beats Data:');
        console.log('  - Total beats:', beats.length);
        
        beats.forEach((beat, i) => {
            const scenesType = Array.isArray(beat.scenes) ? 'array' : typeof beat.scenes;
            const scenesValue = Array.isArray(beat.scenes) ? beat.scenes.length : beat.scenes;
            const status = Array.isArray(beat.scenes) ? '✅' : '❌';
            
            console.log(`  ${status} Beat ${i}: "${beat.title}"`);
            console.log(`      - scenes type: ${scenesType}`);
            console.log(`      - scenes value: ${scenesValue}`);
            console.log(`      - order: ${beat.order}`);
        });
    } catch (e) {
        console.error('  ❌ Failed to parse beats JSON:', e);
    }
}

console.log('\n🎯 Next Steps:');
if (!beatsJSON) {
    console.log('  1. Refresh page to trigger 8-Sequence creation');
    console.log('  2. Run this script again to verify');
} else {
    const beats = JSON.parse(beatsJSON);
    const corrupted = beats.filter(b => !Array.isArray(b.scenes));
    
    if (corrupted.length > 0) {
        console.log('  ❌ Found', corrupted.length, 'corrupted beats');
        console.log('  1. Clear data: localStorage.removeItem("screenplay_beats_v1")');
        console.log('  2. Refresh page');
    } else {
        console.log('  ✅ All beats are healthy!');
    }
}

console.log('='.repeat(50));

