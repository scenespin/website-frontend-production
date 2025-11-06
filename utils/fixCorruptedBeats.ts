/**
 * ONE-TIME DATA MIGRATION
 * Fixes corrupted beats where scenes is a number instead of an array
 */

export function fixCorruptedBeatsInLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
        const beatsJSON = localStorage.getItem('wryda_screenplay_beats');
        if (!beatsJSON) {
            console.log('[Migration] No beats found in localStorage');
            return;
        }
        
        const beats = JSON.parse(beatsJSON);
        
        if (!Array.isArray(beats)) {
            console.error('[Migration] beats is not an array:', typeof beats);
            return;
        }
        
        let fixedCount = 0;
        const fixedBeats = beats.map((beat: any) => {
            if (!Array.isArray(beat.scenes)) {
                console.warn(`[Migration] 🔧 Fixing beat "${beat.title}" - scenes was:`, typeof beat.scenes, beat.scenes);
                fixedCount++;
                return {
                    ...beat,
                    scenes: [] // Replace corrupted scenes with empty array
                };
            }
            return beat;
        });
        
        if (fixedCount > 0) {
            console.log(`[Migration] ✅ Fixed ${fixedCount} corrupted beat(s). Saving to localStorage...`);
            localStorage.setItem('wryda_screenplay_beats', JSON.stringify(fixedBeats));
            localStorage.setItem('wryda_last_migration', new Date().toISOString());
            console.log('[Migration] ✅ Migration complete! Please refresh the page.');
            
            // Force reload to apply fixes
            window.location.reload();
        } else {
            console.log('[Migration] ✅ No corruption found. All beats are healthy!');
        }
    } catch (error) {
        console.error('[Migration] ❌ Failed to fix corrupted beats:', error);
    }
}

