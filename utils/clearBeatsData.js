/**
 * Developer Utility: Clear All Beats Data
 * 
 * USE THIS TO TEST THE FIX:
 * 1. Open browser console on https://www.wryda.ai/beats
 * 2. Paste this code and run it
 * 3. Refresh the page
 * 4. The 8-Sequence Structure should recreate WITHOUT the bug
 */

console.log('🧹 Clearing all beats data...');

// Clear localStorage
localStorage.removeItem('screenplay_beats_v1');
localStorage.removeItem('screenplay_characters_v1');
localStorage.removeItem('screenplay_locations_v1');
localStorage.removeItem('screenplay_relationships_v1');
localStorage.removeItem('screenplay_last_saved');
localStorage.removeItem('screenplay_github_config');
localStorage.removeItem('wryda_beats_migration_v2');
localStorage.removeItem('wryda_last_migration');

console.log('✅ Cleared localStorage beats data');

// Clear any session storage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

console.log('🔄 Now refresh the page to recreate the 8-Sequence Structure');
console.log('📊 Watch the console for: "[ScreenplayContext] Created beats with explicit scenes arrays"');
console.log('✅ If you see "scenes is array" for all 8 beats, the bug is fixed!');

