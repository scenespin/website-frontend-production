'use client';

import React, { useState, useRef } from 'react';
import { X, FileDown, Loader2, Check, Upload } from 'lucide-react';
import { downloadScreenplayPDF } from '@/utils/pdfExport';

interface ExportPDFModalProps {
  screenplay: string;
  onClose: () => void;
}

/**
 * Export PDF Modal - 100% FREE for all users!
 * No plan gating - democratizing professional screenplay export
 */
export function ExportPDFModal({ screenplay, onClose }: ExportPDFModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('Untitled Screenplay');
  const [author, setAuthor] = useState('');
  const [contact, setContact] = useState('');
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('DRAFT');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.1);
  const [watermarkImageSize, setWatermarkImageSize] = useState(3); // inches
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // File input ref for proper handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageUploadError(null);
    
    if (!file) {
      console.log('[PDF Export] No file selected');
      return;
    }
    
    console.log('[PDF Export] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please upload an image file (PNG, JPG, GIF, etc.)';
      console.error('[PDF Export] Invalid file type:', file.type);
      setImageUploadError(error);
      alert(error);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const error = 'Image too large. Please upload an image under 5MB.';
      console.error('[PDF Export] File too large:', file.size);
      setImageUploadError(error);
      alert(error);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Convert to base64 - ensure PNG format for PDF compatibility
    const reader = new FileReader();
    
    reader.onerror = (error) => {
      console.error('[PDF Export] FileReader error:', error);
      const errorMsg = 'Failed to read image file. Please try again.';
      setImageUploadError(errorMsg);
      alert(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        if (!result) {
          throw new Error('No data from FileReader');
        }
        
        console.log('[PDF Export] File read successfully, converting to PNG...');
        
        // Create preview immediately
        setImagePreview(result);
        
        // If image is not PNG, convert it
        if (result.startsWith('data:image/') && !result.startsWith('data:image/png')) {
          console.log('[PDF Export] Converting non-PNG image to PNG format');
          // Convert to PNG using canvas
          const img = new Image();
          
          img.onerror = (error) => {
            console.error('[PDF Export] Image load error:', error);
            const errorMsg = 'Failed to load image. Please try a different file.';
            setImageUploadError(errorMsg);
            alert(errorMsg);
            setImagePreview(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          };
          
          img.onload = () => {
            try {
              console.log('[PDF Export] Image loaded, creating canvas...', {
                width: img.width,
                height: img.height,
              });
              
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                throw new Error('Could not get canvas context');
              }
              
              // Draw image to canvas
              ctx.drawImage(img, 0, 0);
              
              // Convert to PNG
              const pngDataUrl = canvas.toDataURL('image/png');
              console.log('[PDF Export] Image converted to PNG successfully');
              
              setWatermarkImage(pngDataUrl);
              setImagePreview(pngDataUrl);
              setImageUploadError(null);
            } catch (error) {
              console.error('[PDF Export] Canvas conversion error:', error);
              const errorMsg = 'Failed to convert image. Please try a PNG file.';
              setImageUploadError(errorMsg);
              alert(errorMsg);
              setImagePreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }
          };
          
          img.src = result;
        } else {
          // Already PNG or valid format
          console.log('[PDF Export] Image is already in compatible format');
          setWatermarkImage(result);
          setImageUploadError(null);
        }
      } catch (error) {
        console.error('[PDF Export] Error processing image:', error);
        const errorMsg = 'Failed to process image. Please try again.';
        setImageUploadError(errorMsg);
        alert(errorMsg);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setWatermarkImage(null);
    setImagePreview(null);
    setImageUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleExport = async () => {
    if (!screenplay.trim()) {
      alert('No screenplay content to export');
      return;
    }
    
    // Validate watermark image if image type is selected
    if (includeWatermark && watermarkType === 'image') {
      if (!watermarkImage) {
        alert('Please upload an image for the watermark');
        return;
      }
      
      // Validate image format
      if (!watermarkImage.startsWith('data:image/')) {
        alert('Invalid image format. Please upload the image again.');
        return;
      }
      
      console.log('[PDF Export] Validating watermark image before export...', {
        hasImage: !!watermarkImage,
        imageLength: watermarkImage.length,
        imageType: watermarkImage.substring(0, 20),
        imageWidth: watermarkImageSize,
        imageHeight: watermarkImageSize,
        opacity: watermarkOpacity,
      });
    }
    
    setIsExporting(true);
    
    try {
      let watermark = undefined;
      
      if (includeWatermark) {
        if (watermarkType === 'image' && watermarkImage) {
          console.log('[PDF Export] Creating image watermark...', {
            imageLength: watermarkImage.length,
            imagePreview: watermarkImage.substring(0, 50) + '...',
          });
          
          watermark = {
            image: watermarkImage,
            opacity: watermarkOpacity,
            angle: -45,
            imageWidth: watermarkImageSize,
            imageHeight: watermarkImageSize,
          };
        } else if (watermarkType === 'text' && watermarkText.trim()) {
          watermark = {
            text: watermarkText,
            opacity: watermarkOpacity,
            angle: -45,
            fontSize: 72,
          };
        }
      }
      
      // Generate filename
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      console.log('[PDF Export] Starting PDF export...', {
        filename,
        hasWatermark: !!watermark,
        watermarkType: watermark?.image ? 'image' : watermark?.text ? 'text' : 'none',
      });
      
      // Export with full bookmark support
      await downloadScreenplayPDF(
        screenplay,
        filename,
        {
          title,
          author: author || undefined,
          contact: contact || undefined,
          watermark,
        }
      );
      
      console.log('[PDF Export] PDF exported successfully');
      setExported(true);
      
      // Close modal after brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('[PDF Export] Failed:', error);
      console.error('[PDF Export] Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        watermarkType,
        hasWatermarkImage: !!watermarkImage,
      });
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0A]/95 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3F3F46] bg-[#141414]">
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-[#DC143C]" />
            <h2 className="text-xl font-semibold text-[#FFFFFF]">Export to PDF</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-[#FFFFFF] transition-colors p-2 hover:bg-[#1F1F1F] rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0A]">
          
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-[#FFFFFF]">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter screenplay title"
              className="w-full px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
            />
          </div>
          
          {/* Author */}
          <div className="space-y-2">
            <label htmlFor="author" className="text-sm font-medium text-[#FFFFFF]">
              Written by <span className="text-[#808080]">(optional)</span>
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="w-full px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
            />
          </div>
          
          {/* Contact */}
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium text-[#FFFFFF]">
              Contact Information <span className="text-[#808080]">(optional)</span>
            </label>
            <textarea
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email, phone, address"
              rows={3}
              className="w-full px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent resize-none"
            />
          </div>
          
          {/* Watermark Section - FREE FOR ALL! */}
          <div className="space-y-4 pt-4 border-t border-[#3F3F46]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label htmlFor="watermark" className="text-sm font-medium text-[#FFFFFF]">
                  Add Watermark
                </label>
                <p className="text-sm text-[#808080]">
                  🎨 FREE feature - protect your screenplay!
                </p>
              </div>
              <input
                type="checkbox"
                id="watermark"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>
            
            {includeWatermark && (
              <div className="space-y-4 pl-4 border-l-2 border-[#DC143C]/30">
                {/* Watermark Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]">
                    Watermark Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWatermarkType('text')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        watermarkType === 'text' 
                          ? 'bg-[#DC143C] text-white' 
                          : 'bg-[#141414] border border-[#3F3F46] text-[#E5E7EB] hover:bg-[#1F1F1F]'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setWatermarkType('image')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        watermarkType === 'image' 
                          ? 'bg-[#DC143C] text-white' 
                          : 'bg-[#141414] border border-[#3F3F46] text-[#E5E7EB] hover:bg-[#1F1F1F]'
                      }`}
                    >
                      Image/Logo
                    </button>
                  </div>
                </div>
                
                {/* Text Watermark */}
                {watermarkType === 'text' && (
                  <div className="space-y-2">
                    <label htmlFor="watermark-text" className="text-sm font-medium text-[#FFFFFF]">
                      Watermark Text
                    </label>
                    <input
                      id="watermark-text"
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="DRAFT"
                      maxLength={30}
                      className="w-full px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                    />
                    <p className="text-xs text-[#808080]">
                      Max 30 characters (e.g., "DRAFT", "CONFIDENTIAL")
                    </p>
                  </div>
                )}
                
                {/* Image Watermark */}
                {watermarkType === 'image' && (
                  <div className="space-y-2">
                    <label htmlFor="watermark-image" className="text-sm font-medium text-[#FFFFFF]">
                      Upload Logo/Image
                    </label>
                    
                    {/* File Input Button */}
                    <div className="flex gap-2">
                      <label 
                        htmlFor="watermark-image" 
                        className="flex-1 px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#E5E7EB] hover:bg-[#1F1F1F] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                        onClick={(e) => {
                          // Prevent label from triggering if clicking on button text
                          if (e.target !== e.currentTarget) {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {watermarkImage ? 'Change Image' : 'Choose Image'}
                      </label>
                      {watermarkImage && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#808080] hover:text-[#FFFFFF] hover:bg-[#1F1F1F] transition-colors"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      id="watermark-image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative border border-[#3F3F46] rounded-lg p-2 bg-[#141414]">
                        <img
                          src={imagePreview}
                          alt="Watermark preview"
                          className="max-h-32 mx-auto object-contain rounded"
                        />
                        <p className="text-xs text-green-400 mt-2 text-center">
                          ✓ Image uploaded successfully
                        </p>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {imageUploadError && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg py-2 px-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-red-400 shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-red-400">{imageUploadError}</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-[#808080]">
                      PNG, JPG, GIF, or WebP. Max 5MB. Transparent backgrounds work best.
                    </p>
                  </div>
                )}
                
                {/* Image Size (for image watermarks) */}
                {watermarkType === 'image' && watermarkImage && (
                  <div className="space-y-2">
                    <label htmlFor="image-size" className="text-sm font-medium text-[#FFFFFF]">
                      Image Size: {watermarkImageSize}" × {watermarkImageSize}"
                    </label>
                    <input
                      id="image-size"
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={watermarkImageSize}
                      onChange={(e) => setWatermarkImageSize(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#DC143C]"
                    />
                    <div className="flex justify-between text-xs text-[#808080]">
                      <span>1"</span>
                      <span>3"</span>
                      <span>5"</span>
                    </div>
                  </div>
                )}
                
                {/* Opacity Slider */}
                <div className="space-y-2">
                  <label htmlFor="opacity" className="text-sm font-medium text-[#FFFFFF]">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </label>
                  <input
                    id="opacity"
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.01"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#DC143C]"
                  />
                  <div className="flex justify-between text-xs text-[#808080]">
                    <span>5%</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Info Alert */}
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-blue-400 shrink-0 w-5 h-5 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="text-sm text-[#E5E7EB]">
              <strong className="text-[#FFFFFF]">Industry-Standard Format:</strong> Courier 12pt, proper margins, scene bookmarks, professional page numbering.
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-[#3F3F46] flex gap-3 bg-[#141414]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#E5E7EB] hover:bg-[#1F1F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isExporting || !title.trim()}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : exported ? (
              <>
                <Check className="w-4 h-4" />
                Exported!
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

