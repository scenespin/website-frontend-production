/**
 * ONE-TIME DATA MIGRATION
 * Fixes corrupted beats where scenes is a number instead of an array
 */

export function fixCorruptedBeatsInLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
        // Use the CORRECT localStorage key
        const beatsJSON = localStorage.getItem('screenplay_beats_v1');
        if (!beatsJSON) {
            console.log('[Migration] No beats found in localStorage');
            localStorage.setItem('wryda_last_migration', new Date().toISOString());
            return;
        }
        
        const beats = JSON.parse(beatsJSON);
        
        if (!Array.isArray(beats)) {
            console.error('[Migration] beats is not an array:', typeof beats);
            localStorage.setItem('wryda_last_migration', new Date().toISOString());
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
            localStorage.setItem('screenplay_beats_v1', JSON.stringify(fixedBeats));
        } else {
            console.log('[Migration] ✅ No corruption found. All beats are healthy!');
        }
        
        // Mark migration as complete
        localStorage.setItem('wryda_last_migration', new Date().toISOString());
    } catch (error) {
        console.error('[Migration] ❌ Failed to fix corrupted beats:', error);
        localStorage.setItem('wryda_last_migration', new Date().toISOString());
    }
}

