// ============================================================================
// Browser Console Test Script for batch-update-props
// ============================================================================
// Copy and paste this entire script into your browser console on wryda.ai
// Make sure you're logged in first!

(async function testBatchUpdateProps() {
  console.log('🧪 Testing batch-update-props endpoint...\n');
  
  // Step 1: Get the auth token
  let token = null;
  
  try {
    // Method 1: Try to get from Clerk session
    if (window.Clerk?.session) {
      console.log('📝 Getting token from Clerk session...');
      token = await window.Clerk.session.getToken({ template: 'wryda-backend' });
      console.log('✅ Token obtained from Clerk\n');
    }
  } catch (error) {
    console.warn('⚠️ Could not get token from Clerk:', error);
  }
  
  // Method 2: If Clerk didn't work, try to intercept from next fetch
  if (!token) {
    console.log('📡 Setting up fetch interceptor to capture token...');
    console.log('   (Make any action in the app to trigger an API call)\n');
    
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options] = args;
      if (options?.headers) {
        const authHeader = options.headers.get?.('Authorization') || 
                          options.headers['Authorization'] ||
                          (typeof options.headers === 'object' && options.headers.Authorization);
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '');
          console.log('✅ Token captured from fetch request!');
          window.fetch = originalFetch; // Restore
        }
      }
      return originalFetch.apply(this, args);
    };
    
    // Wait a bit for a request to happen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!token) {
      console.error('❌ Could not get token automatically.');
      console.log('\n📋 Manual method:');
      console.log('1. Open Network tab in DevTools');
      console.log('2. Find any request to /api/screenplays/...');
      console.log('3. Click it → Headers → Request Headers');
      console.log('4. Copy the "Authorization: Bearer ..." value');
      console.log('5. Run: testWithToken("YOUR_TOKEN_HERE")');
      return;
    }
  }
  
  // Step 2: Test the endpoint
  console.log('🚀 Testing endpoint...\n');
  
  const screenplayId = 'screenplay_c268ba09-7bc8-4c2d-a238-ca4633e99f6d';
  const assetId = 'asset-1766423939767-yt004dcl';
  
  try {
    const response = await fetch(`/api/screenplays/${screenplayId}/scenes/batch-update-props`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        asset_id: assetId,
        scene_ids_to_link: [],
        scene_ids_to_unlink: []
      })
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    
    const data = await response.json();
    console.log('📦 Response Data:', data);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Endpoint is working!');
      console.log('   The route is properly configured and responding.');
    } else {
      console.log('\n❌ Error Response:');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error || data.message || 'Unknown error');
      
      if (response.status === 401) {
        console.log('\n💡 Tip: Token might be expired. Try refreshing the page and running again.');
      } else if (response.status === 404) {
        console.log('\n💡 Tip: Route might not be deployed yet. Check Vercel deployment.');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    console.log('\n💡 Check:');
    console.log('   - Are you logged in?');
    console.log('   - Is the page fully loaded?');
    console.log('   - Check Network tab for more details');
  }
})();

// ============================================================================
// Alternative: Test with manual token
// ============================================================================
// If the above doesn't work, get token manually and run this:

async function testWithToken(token) {
  const screenplayId = 'screenplay_c268ba09-7bc8-4c2d-a238-ca4633e99f6d';
  const assetId = 'asset-1766423939767-yt004dcl';
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes/batch-update-props`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      asset_id: assetId,
      scene_ids_to_link: [],
      scene_ids_to_unlink: []
    })
  });
  
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
}
