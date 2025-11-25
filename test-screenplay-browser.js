/**
 * Browser Console Test Script for Screenplay GET Request
 * 
 * Usage:
 * 1. Open browser console (F12) on https://www.wryda.ai
 * 2. Make sure you're logged in
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter
 * 
 * This will test the Next.js API route with your actual browser session.
 */

(async function testScreenplayGet() {
  const screenplayId = 'screenplay_b236a087-3d02-4dc9-ac09-9315adf8a1fe';
  
  console.log('=== Screenplay GET Request Test ===');
  console.log('Screenplay ID:', screenplayId);
  console.log('');
  
  try {
    console.log('Step 1: Testing Next.js API route...');
    console.log('URL: /api/screenplays/' + screenplayId);
    
    const response = await fetch(`/api/screenplays/${screenplayId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('');
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response OK:', response.ok);
    console.log('');
    
    // Get response headers
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Response Headers:', headers);
    console.log('');
    
    // Get response body
    const responseText = await response.text();
    console.log('Response Body (raw):', responseText);
    console.log('');
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Response Body (parsed):', responseData);
    } catch (e) {
      console.warn('Could not parse response as JSON:', e);
      responseData = responseText;
    }
    
    console.log('');
    
    // Analyze response
    if (response.ok) {
      console.log('✅ SUCCESS: Screenplay loaded successfully!');
      if (responseData?.data) {
        console.log('Screenplay Title:', responseData.data.title);
        console.log('Screenplay Status:', responseData.data.status);
        console.log('Screenplay User ID:', responseData.data.user_id);
        console.log('Screenplay ID:', responseData.data.screenplay_id);
      }
    } else {
      console.error('❌ FAILED: Request returned error status');
      console.error('Status:', response.status);
      console.error('Error:', responseData);
      
      if (response.status === 404) {
        console.error('');
        console.error('404 Error Analysis:');
        console.error('- Screenplay might not exist');
        console.error('- Screenplay might be deleted');
        console.error('- Permission check might have failed');
        console.error('- Check Next.js server logs for details');
      } else if (response.status === 401) {
        console.error('');
        console.error('401 Error Analysis:');
        console.error('- Authentication failed');
        console.error('- Session might be expired');
        console.error('- Try logging out and logging back in');
      } else if (response.status === 403) {
        console.error('');
        console.error('403 Error Analysis:');
        console.error('- You don\'t have access to this screenplay');
        console.error('- Check if you\'re the owner or a collaborator');
      }
    }
    
    console.log('');
    console.log('=== Test Complete ===');
    
    // Return response for further inspection
    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      headers: headers
    };
    
  } catch (error) {
    console.error('❌ ERROR: Test failed with exception');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return null;
  }
})();

