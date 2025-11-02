'use client';

import React, { useState } from 'react';
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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please upload an image under 5MB.');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setWatermarkImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleExport = async () => {
    if (!screenplay.trim()) {
      alert('No screenplay content to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      let watermark = undefined;
      
      if (includeWatermark) {
        if (watermarkType === 'image' && watermarkImage) {
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
      
      setExported(true);
      
      // Close modal after brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('[PDF Export] Failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-cinema-red" />
            <h2 className="text-xl font-semibold text-base-content">Export to PDF</h2>
          </div>
          <button
            onClick={onClose}
            className="text-base-content/60 hover:text-base-content transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-base-content">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter screenplay title"
              className="input input-bordered w-full bg-base-200 text-base-content"
            />
          </div>
          
          {/* Author */}
          <div className="space-y-2">
            <label htmlFor="author" className="text-sm font-medium text-base-content">
              Written by <span className="text-base-content/60">(optional)</span>
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="input input-bordered w-full bg-base-200 text-base-content"
            />
          </div>
          
          {/* Contact */}
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium text-base-content">
              Contact Information <span className="text-base-content/60">(optional)</span>
            </label>
            <textarea
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email, phone, address"
              rows={3}
              className="textarea textarea-bordered w-full bg-base-200 text-base-content"
            />
          </div>
          
          {/* Watermark Section - FREE FOR ALL! */}
          <div className="space-y-4 pt-4 border-t border-base-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label htmlFor="watermark" className="text-sm font-medium text-base-content">
                  Add Watermark
                </label>
                <p className="text-sm text-base-content/60">
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
              <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                {/* Watermark Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-base-content">
                    Watermark Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWatermarkType('text')}
                      className={`btn btn-sm flex-1 ${
                        watermarkType === 'text' ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setWatermarkType('image')}
                      className={`btn btn-sm flex-1 ${
                        watermarkType === 'image' ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      Image/Logo
                    </button>
                  </div>
                </div>
                
                {/* Text Watermark */}
                {watermarkType === 'text' && (
                  <div className="space-y-2">
                    <label htmlFor="watermark-text" className="text-sm font-medium text-base-content">
                      Watermark Text
                    </label>
                    <input
                      id="watermark-text"
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="DRAFT"
                      maxLength={30}
                      className="input input-bordered w-full bg-base-200 text-base-content"
                    />
                    <p className="text-xs text-base-content/60">
                      Max 30 characters (e.g., "DRAFT", "CONFIDENTIAL")
                    </p>
                  </div>
                )}
                
                {/* Image Watermark */}
                {watermarkType === 'image' && (
                  <div className="space-y-2">
                    <label htmlFor="watermark-image" className="text-sm font-medium text-base-content">
                      Upload Logo/Image
                    </label>
                    <label className="btn btn-outline w-full cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {watermarkImage ? 'Change Image' : 'Choose Image'}
                      <input
                        id="watermark-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {watermarkImage && (
                      <p className="text-xs text-success">✓ Image uploaded successfully</p>
                    )}
                    <p className="text-xs text-base-content/60">
                      PNG, JPG, or GIF. Max 5MB.
                    </p>
                  </div>
                )}
                
                {/* Image Size (for image watermarks) */}
                {watermarkType === 'image' && watermarkImage && (
                  <div className="space-y-2">
                    <label htmlFor="image-size" className="text-sm font-medium text-base-content">
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
                      className="range range-primary range-sm"
                    />
                    <div className="flex justify-between text-xs text-base-content/60">
                      <span>1"</span>
                      <span>3"</span>
                      <span>5"</span>
                    </div>
                  </div>
                )}
                
                {/* Opacity Slider */}
                <div className="space-y-2">
                  <label htmlFor="opacity" className="text-sm font-medium text-base-content">
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
                    className="range range-primary range-sm"
                  />
                  <div className="flex justify-between text-xs text-base-content/60">
                    <span>5%</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Info Alert */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="text-sm">
              <strong>Industry-Standard Format:</strong> Courier 12pt, proper margins, scene bookmarks, professional page numbering.
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-base-300 flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="btn btn-primary flex-1"
            disabled={isExporting || !title.trim()}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : exported ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Exported!
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

