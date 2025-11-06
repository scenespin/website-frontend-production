/**
 * URGENT DIAGNOSTIC: Run this in console RIGHT NOW
 * This will show us exactly what got saved to localStorage
 */

console.log('🔍 CHECKING WHAT GOT SAVED TO LOCALSTORAGE:');
const beatsJSON = localStorage.getItem('screenplay_beats_v1');

if (beatsJSON) {
    const beats = JSON.parse(beatsJSON);
    console.log('\n📊 Total beats in localStorage:', beats.length);
    console.log('\n🔬 Detailed inspection:');
    
    beats.forEach((beat, i) => {
        const scenesType = Array.isArray(beat.scenes) ? '✅ array' : `❌ ${typeof beat.scenes}`;
        console.log(`Beat ${i}: "${beat.title}"`);
        console.log(`  - scenes type: ${scenesType}`);
        console.log(`  - scenes value:`, beat.scenes);
        console.log(`  - order:`, beat.order);
        console.log('');
    });
} else {
    console.log('❌ No beats in localStorage!');
}

// Also check if beats is in memory
console.log('\n🧠 Checking React state (if accessible):');
console.log('This might not work, but worth a try...');

