/**
 * Image Provider Configuration
 * 
 * Defines available image generation providers for launch.
 * Strategy: Give users choice (style matters!) while guiding toward cost-effective defaults.
 * 
 * Feature 0058: Provider Choice Strategy
 */

export interface ImageProviderConfig {
    id: string;                      // Provider ID (e.g., 'photon-1', 'imagen-3', 'dalle-3')
    backendModelId: string;          // Maps to backend MODEL_COST_MAP id
    label: string;                   // Display name
    description: string;             // Short description (one line)
    tooltip: string;                 // Educational tooltip content (hover text)
    creditsPerGeneration: number;    // Credit cost
    speed: 'instant' | 'fast' | 'standard';
    quality: 'high' | 'premium' | 'cinematic';
    styleHint: string;               // Style category: 'fast-versatile' | 'photorealistic' | 'creative'
    recommended: boolean;            // Show ⭐ badge
    advancedOnly: boolean;           // Hide in simple mode
    enabled: boolean;                // Backend has working implementation
    launchReady: boolean;            // Show to users at launch
    examplePrompts?: string[];       // Example prompts that work well with this provider
}

/**
 * Launch-Ready Image Providers (October 2025)
 * 
 * RECOMMENDED (80% of users):
 * - Photon Flash (3 credits) - Fastest, perfect for iteration
 * - Photon 1 (8 credits) - Best all-around choice (DEFAULT)
 * 
 * ADVANCED:
 * - Imagen 3 (15 credits) - Photorealistic
 * - DALL-E 3 (20 credits) - Creative & artistic
 */
export const IMAGE_PROVIDERS: ImageProviderConfig[] = [
    // ⭐ RECOMMENDED - Photon Flash (Fastest)
    {
        id: 'photon-flash',
        backendModelId: 'luma-photon-flash',
        label: 'Photon Flash',
        description: 'Lightning fast • Great quality • Perfect for iteration',
        tooltip: 'Fastest generation (~10s). Great for quick concepts and iterations. Balanced quality that works for most use cases.',
        creditsPerGeneration: 3,
        speed: 'instant',
        quality: 'high',
        styleHint: 'fast-versatile',
        recommended: true,
        advancedOnly: false,
        enabled: true,
        launchReady: true,
        examplePrompts: [
            'A cozy coffee shop interior, warm lighting',
            'Futuristic city skyline at sunset',
            'Dark alleyway at night, neon signs',
        ],
    },
    
    // ⭐ RECOMMENDED - Photon 1 (Best Balance) - DEFAULT
    {
        id: 'photon-1',
        backendModelId: 'luma-photon-1',
        label: 'Photon 1',
        description: 'Premium quality • Best all-around choice',
        tooltip: 'Professional quality that works for most projects. Fast generation (~15-20s). This is the sweet spot between quality and cost.',
        creditsPerGeneration: 8,
        speed: 'fast',
        quality: 'premium',
        styleHint: 'fast-versatile',
        recommended: true,
        advancedOnly: false,
        enabled: true,
        launchReady: true,
        examplePrompts: [
            'Portrait of a woman in a 1940s film noir setting',
            'Abandoned warehouse with dramatic shadows',
            'Luxurious penthouse apartment, city view',
        ],
    },
    
    // ADVANCED - Imagen 3 (Photorealistic)
    {
        id: 'imagen-3',
        backendModelId: 'imagen-3',
        label: 'Imagen 3',
        description: 'Photorealistic • Google\'s latest • Accurate & clean',
        tooltip: 'Google\'s photorealistic model. Best for accurate, clean images. Excels at portraits, product shots, and realistic scenes. Slower but higher detail.',
        creditsPerGeneration: 15,
        speed: 'fast',
        quality: 'premium',
        styleHint: 'photorealistic',
        recommended: false,
        advancedOnly: true,
        enabled: true,
        launchReady: true,
        examplePrompts: [
            'Professional headshot, business attire, neutral background',
            'Product photography: coffee mug on wooden table',
            'Realistic interior design, Scandinavian living room',
        ],
    },
    
    // ADVANCED - DALL-E 3 (Creative)
    {
        id: 'dalle-3',
        backendModelId: 'dalle-3',
        label: 'DALL-E 3',
        description: 'Creative & detailed • OpenAI • Artistic interpretation',
        tooltip: 'OpenAI\'s creative model. Best for artistic concepts, stylized images, and creative interpretations. Handles complex prompts well. Great for concept art.',
        creditsPerGeneration: 20,
        speed: 'standard',
        quality: 'premium',
        styleHint: 'creative',
        recommended: false,
        advancedOnly: true,
        enabled: true,
        launchReady: true,
        examplePrompts: [
            'Steampunk airship over Victorian London, concept art style',
            'Abstract representation of artificial intelligence',
            'Fantasy character design, dragon knight armor',
        ],
    },
];

/**
 * Get default provider (Photon 1 - best balance)
 */
export function getDefaultProvider(): ImageProviderConfig {
    return IMAGE_PROVIDERS.find(p => p.id === 'photon-1') || IMAGE_PROVIDERS[1];
}

/**
 * Get recommended providers (show at top)
 */
export function getRecommendedProviders(): ImageProviderConfig[] {
    return IMAGE_PROVIDERS.filter(p => p.recommended && p.launchReady);
}

/**
 * Get advanced providers (show in advanced section)
 */
export function getAdvancedProviders(): ImageProviderConfig[] {
    return IMAGE_PROVIDERS.filter(p => p.advancedOnly && p.launchReady);
}

/**
 * Get provider by ID
 */
export function getProviderById(id: string): ImageProviderConfig | undefined {
    return IMAGE_PROVIDERS.find(p => p.id === id);
}

/**
 * Get all launch-ready providers
 */
export function getLaunchReadyProviders(): ImageProviderConfig[] {
    return IMAGE_PROVIDERS.filter(p => p.enabled && p.launchReady);
}

/**
 * Educational content for "Which model should I use?" help
 */
export const PROVIDER_COMPARISON_GUIDE = {
    title: 'Which Image Model Should I Use?',
    sections: [
        {
            title: '⚡ For Quick Iteration & Testing',
            provider: 'Photon Flash',
            benefits: [
                'Fastest generation (~10 seconds)',
                'Only 3 credits per image',
                'Great for trying multiple variations',
                'Good quality for most use cases',
            ],
            useCases: ['Concept exploration', 'Quick mockups', 'Style testing', 'Location concepts'],
        },
        {
            title: '🎯 For Most Projects (Recommended)',
            provider: 'Photon 1',
            benefits: [
                'Professional quality',
                'Fast generation (~15-20 seconds)',
                'Best balance of quality and cost',
                'Versatile for all use cases',
            ],
            useCases: ['Character portraits', 'Scene concepts', 'Storyboards', 'Production images'],
        },
        {
            title: '📸 For Photorealistic Images',
            provider: 'Imagen 3',
            benefits: [
                'Google\'s photorealistic model',
                'Exceptional accuracy and detail',
                'Clean, professional results',
                'Best for realistic scenarios',
            ],
            useCases: ['Product photography', 'Realistic portraits', 'Interior design', 'Business content'],
        },
        {
            title: '🎨 For Creative & Artistic Images',
            provider: 'DALL-E 3',
            benefits: [
                'OpenAI\'s creative model',
                'Handles complex prompts',
                'Artistic interpretation',
                'Great for stylized content',
            ],
            useCases: ['Concept art', 'Fantasy characters', 'Abstract concepts', 'Stylized scenes'],
        },
    ],
    tips: [
        'Start with Photon 1 for most projects - it\'s the best all-around choice',
        'Use Photon Flash when iterating on ideas quickly',
        'Choose Imagen 3 when you need maximum photorealism',
        'Pick DALL-E 3 for creative or artistic interpretations',
        'Each model responds differently to prompts - experiment to find your style!',
    ],
};

