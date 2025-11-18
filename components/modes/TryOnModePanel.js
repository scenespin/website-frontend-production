'use client';

import { useState, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@clerk/nextjs';
import { Users, Upload, Loader2, Download, Save, Clock, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export function TryOnModePanel({ onInsert }) {
  const { state, addMessage } = useChatContext();
  const { getToken } = useAuth();
  const [personImage, setPersonImage] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [sampleCount, setSampleCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cloudStorageModalOpen, setCloudStorageModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [results, setResults] = useState([]);
  const [isUploading, setIsUploading] = useState({ person: false, product: false });
  
  const personFileInput = useRef(null);
  const productFileInput = useRef(null);
  
  // Sample count options
  const sampleOptions = [
    { value: 1, label: '1 Image', credits: 100 },
    { value: 2, label: '2 Images', credits: 125 },
    { value: 3, label: '3 Images', credits: 150 },
    { value: 4, label: '4 Images', credits: 175 }
  ];
  
  const selectedOption = sampleOptions.find(opt => opt.value === sampleCount);
  
  // Handle local file upload (using presigned POST system)
  const handleLocalUpload = async (file, type) => {
    if (!file) return;
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/png'];
    let fileType = file.type;
    if (!fileType || !fileType.startsWith('image/')) {
      // Try to detect from extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      fileType = mimeTypes[extension] || 'image/jpeg';
    }
    
    if (!validTypes.includes(fileType)) {
      toast.error('Please upload JPEG or PNG images only');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }
    
    setIsUploading({ ...isUploading, [type]: true });
    setUploadProgress({ [type]: 0 });
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Step 1: Get presigned POST URL
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(fileType)}` +
        `&fileSize=${file.size}` +
        `&projectId=default`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error('File too large. Maximum size is 10MB.');
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }
      }
      
      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }
      
      // Step 2: Upload directly to S3 using FormData POST
      const formData = new FormData();
      
      // Add all fields from presigned POST (except 'bucket')
      Object.entries(fields).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'bucket') {
          formData.append(key, value);
        }
      });
      
      // Add the file last
      formData.append('file', file);
      
      // Upload to S3
      const s3Response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!s3Response.ok) {
        const errorText = await s3Response.text().catch(() => 'No error details');
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }
      
      // Step 3: Register file in DynamoDB (optional for try-on)
      try {
        await fetch('/api/media/register', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: 'default',
            fileName: file.name,
            fileType: fileType,
            fileSize: file.size,
            s3Key,
          }),
        });
      } catch (regError) {
        // Registration is optional - log but don't fail
        console.warn('[TryOnMode] Failed to register file:', regError);
      }
      
      // Step 4: Get download URL for preview
      const downloadUrlResponse = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          expiresIn: 3600 // 1 hour
        }),
      });
      
      let downloadUrl = null;
      if (downloadUrlResponse.ok) {
        const downloadData = await downloadUrlResponse.json();
        downloadUrl = downloadData.downloadUrl;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          source: 's3',
          s3Key: s3Key,
          url: downloadUrl || `s3://${s3Key}`, // Fallback if download URL fails
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          preview: e.target.result
        };
        
        if (type === 'person') {
          setPersonImage(imageData);
        } else {
          setProductImage(imageData);
        }
        
        toast.success(`${type === 'person' ? 'Person' : 'Product'} image uploaded!`);
      };
      reader.readAsDataURL(file);
      
      setUploadProgress({});
      setIsUploading({ ...isUploading, [type]: false });
      
    } catch (error) {
      console.error('[TryOnMode] Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setUploadProgress({});
      setIsUploading({ ...isUploading, [type]: false });
    }
  };
  
  // Handle cloud storage selection
  const handleCloudSelect = (type) => {
    setSelectingFor(type);
    setCloudStorageModalOpen(true);
  };
  
  // Handle cloud image selected (from CloudFilePicker modal)
  const handleCloudImageSelected = (imageData) => {
    if (selectingFor === 'person') {
      setPersonImage(imageData);
      toast.success('Person image selected from cloud!');
    } else {
      setProductImage(imageData);
      toast.success('Product image selected from cloud!');
    }
    setCloudStorageModalOpen(false);
    setSelectingFor(null);
  };
  
  // Generate try-on images
  const handleGenerate = async () => {
    if (!personImage || !productImage) {
      toast.error('Please select both person and product images');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      addMessage({
        role: 'user',
        content: `Generate ${sampleCount} virtual try-on image${sampleCount > 1 ? 's' : ''}`,
        mode: 'try-on'
      });
      
      // Call API
      const requestData = {
        sampleCount
      };
      
      // Add image sources based on origin
      if (personImage.source === 's3') {
        requestData.personImageS3Key = personImage.s3Key;
      } else {
        requestData.personImageSource = {
          provider: personImage.provider,
          fileId: personImage.fileId
        };
      }
      
      if (productImage.source === 's3') {
        requestData.productImageS3Key = productImage.s3Key;
      } else {
        requestData.productImageSource = {
          provider: productImage.provider,
          fileId: productImage.fileId
        };
      }
      
      const response = await api.tryOn.generate(requestData);
      
      setResults(response.data.predictions);
      
      addMessage({
        role: 'assistant',
        content: `✅ Generated ${response.data.predictions.length} try-on image${response.data.predictions.length > 1 ? 's' : ''}!\n\n⚠️ **7-Day Expiration**: Images will be automatically deleted after 7 days. Please download or save to cloud storage.`,
        mode: 'try-on',
        tryOnResults: response.data.predictions
      });
      
      toast.success('Try-on images generated!');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate try-on images');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, try-on generation failed. Please try again.',
        mode: 'try-on'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Download image
  const handleDownload = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `try-on-result-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };
  
  // Save to cloud
  const handleSaveToCloud = async (imageUrl, provider) => {
    try {
      toast.loading(`Saving to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}...`);
      
      await api.cloudStorage.uploadFile(provider, {
        sourceUrl: imageUrl,
        filename: `try-on-result-${Date.now()}.png`,
        folder: '/Wryda Screenplays/Try-On Results'
      });
      
      toast.dismiss();
      toast.success(`Saved to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}!`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to save to ${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'}`);
    }
  };
  
  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Virtual Try-On</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Upload person + product images to visualize outfits</p>
      </div>
      
      {/* Image Selectors */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-4 max-h-80 overflow-y-auto">
        {/* Person Image */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">PERSON IMAGE</label>
          {personImage ? (
            <div className="relative">
              <img src={personImage.preview || personImage.url} alt="Person" className="w-full h-32 object-cover rounded-lg" />
              <button
                onClick={() => setPersonImage(null)}
                className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
              >
                ×
              </button>
              {personImage.expiresAt && (
                <div className="absolute bottom-2 left-2 badge badge-sm bg-black/70 text-base-content border-none">
                  <Clock className="w-3 h-3 mr-1" />
                  {getDaysUntilExpiration(personImage.expiresAt)}d left
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => personFileInput.current?.click()}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-xs">Upload</span>
              </button>
              <button
                onClick={() => handleCloudSelect('person')}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Droplet className="w-4 h-4 mb-1" />
                <span className="text-xs">Dropbox</span>
              </button>
              <button
                onClick={() => handleCloudSelect('person')}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Save className="w-4 h-4 mb-1" />
                <span className="text-xs">Drive</span>
              </button>
            </div>
          )}
          <input
            ref={personFileInput}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleLocalUpload(e.target.files?.[0], 'person')}
            className="hidden"
          />
          {uploadProgress.person !== undefined && (
            <div className="mt-2">
              <progress className="progress progress-primary w-full" value={uploadProgress.person} max="100"></progress>
            </div>
          )}
        </div>
        
        {/* Product Image */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">PRODUCT IMAGE</label>
          {productImage ? (
            <div className="relative">
              <img src={productImage.preview || productImage.url} alt="Product" className="w-full h-32 object-cover rounded-lg" />
              <button
                onClick={() => setProductImage(null)}
                className="absolute top-2 right-2 btn btn-xs btn-circle btn-error"
              >
                ×
              </button>
              {productImage.expiresAt && (
                <div className="absolute bottom-2 left-2 badge badge-sm bg-black/70 text-base-content border-none">
                  <Clock className="w-3 h-3 mr-1" />
                  {getDaysUntilExpiration(productImage.expiresAt)}d left
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => productFileInput.current?.click()}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-xs">Upload</span>
              </button>
              <button
                onClick={() => handleCloudSelect('product')}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Droplet className="w-4 h-4 mb-1" />
                <span className="text-xs">Dropbox</span>
              </button>
              <button
                onClick={() => handleCloudSelect('product')}
                className="btn btn-sm btn-outline flex-col h-auto py-3"
                disabled={isGenerating}
              >
                <Save className="w-4 h-4 mb-1" />
                <span className="text-xs">Drive</span>
              </button>
            </div>
          )}
          <input
            ref={productFileInput}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleLocalUpload(e.target.files?.[0], 'product')}
            className="hidden"
          />
          {uploadProgress.product !== undefined && (
            <div className="mt-2">
              <progress className="progress progress-primary w-full" value={uploadProgress.product} max="100"></progress>
            </div>
          )}
        </div>
        
        {/* Sample Count */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">NUMBER OF IMAGES</label>
          <div className="grid grid-cols-4 gap-2">
            {sampleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSampleCount(option.value)}
                disabled={isGenerating}
                className={`btn btn-xs ${
                  sampleCount === option.value 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } flex-col h-auto py-2`}
              >
                <span className="font-semibold text-xs">{option.value}</span>
                <span className="badge badge-xs mt-1">{option.credits}cr</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!personImage || !productImage || isGenerating}
          className="btn btn-primary w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Try-On ({selectedOption?.credits} credits)
            </>
          )}
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'try-on')
          .map((message, index) => {
            const isUser = message.role === 'user';
            
            return (
              <div key={index}>
                <div
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    isUser 
                      ? 'bg-cinema-red text-base-content' 
                      : 'bg-base-200 text-base-content'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
                
                {/* Try-on results */}
                {message.tryOnResults && (
                  <div className="grid grid-cols-2 gap-2 max-w-[85%]">
                    {message.tryOnResults.map((result, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={result.s3Url} 
                          alt={`Try-on result ${idx + 1}`}
                          className="w-full rounded-lg border border-cinema-gold/20"
                        />
                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={() => handleDownload(result.s3Url, idx)}
                            className="btn btn-xs btn-outline flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </button>
                          <button
                            onClick={() => handleSaveToCloud(result.s3Url, 'dropbox')}
                            className="btn btn-xs btn-outline"
                          >
                            Dropbox
                          </button>
                          <button
                            onClick={() => handleSaveToCloud(result.s3Url, 'google-drive')}
                            className="btn btn-xs btn-outline"
                          >
                            Drive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        
        {/* Loading state */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
              <span className="text-sm">Generating try-on images...</span>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'try-on').length === 0 && !isGenerating && (
          <div className="text-center text-base-content/60 py-10">
            <Users className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Virtual Try-On</p>
            <p className="text-sm mb-6">See how products look on people using AI</p>
            
            <div className="text-xs text-left bg-base-200 p-3 rounded-lg max-w-sm mx-auto space-y-2">
              <p className="font-semibold">💡 Perfect for:</p>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li>Character costume design</li>
                <li>Product placement visualization</li>
                <li>Fashion & wardrobe testing</li>
                <li>Marketing content creation</li>
              </ul>
              <p className="font-semibold mt-3">⚠️ 7-Day Storage:</p>
              <p className="text-base-content/70">Images auto-delete after 7 days. Save to cloud for persistence.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>👔 Google Virtual Try-On • 7-day S3 storage • Save to cloud for persistence</p>
      </div>
      
      {/* CloudFilePicker Modal (TODO: Implement) */}
      {cloudStorageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center">
          <div className="bg-base-100 p-4 rounded-lg">
            <p>CloudFilePicker component coming next!</p>
            <p className="text-sm text-base-content/60 mt-2">Selecting for: {selectingFor}</p>
            <button onClick={() => setCloudStorageModalOpen(false)} className="btn btn-sm mt-4">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

