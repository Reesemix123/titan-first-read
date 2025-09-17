// Enhanced Playbook Upload Component with Image Support
// src/components/PlaybookUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { extractPDFPages, extractPlaysFromPages, ExtractedPlay } from '@/lib/pdfExtraction';

interface PlaybookUploadProps {
  teamId: string;
  onPlaysExtracted?: (plays: ExtractedPlay[]) => void;
  onUploadComplete?: () => void;
}

export default function PlaybookUpload({ teamId, onPlaysExtracted, onUploadComplete }: PlaybookUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedPlays, setExtractedPlays] = useState<ExtractedPlay[]>([]);
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    setExtractedPlays([]);
    setSelectedPlays(new Set());
    
    try {
      setProgress({ current: 0, total: 2, message: 'Uploading PDF...' });
      
      // Upload to Supabase Storage
      const fileName = `${teamId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('playbooks')
        .upload(fileName, file);

      if (error) throw error;

      setProgress({ current: 1, total: 2, message: 'PDF uploaded successfully' });
      console.log('File uploaded successfully:', data.path);
      
      // Extract pages and plays
      await extractPlaysFromFile(file);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  const extractPlaysFromFile = async (file: File) => {
    setExtracting(true);
    
    try {
      setProgress({ current: 0, total: 3, message: 'Processing PDF pages...' });
      
      // Extract all pages with text and images
      const pages = await extractPDFPages(file);
      console.log(`Extracted ${pages.length} pages`);
      
      setProgress({ current: 1, total: 3, message: 'Analyzing pages for plays...' });
      
      // Extract plays from pages
      const plays = extractPlaysFromPages(pages);
      console.log('Extracted plays:', plays);
      
      setProgress({ current: 2, total: 3, message: 'Processing complete' });
      
      setExtractedPlays(plays);
      
      // Auto-select high confidence plays
      const autoSelected = new Set(
        plays
          .filter(play => play.confidence === 'high')
          .map(play => play.name)
      );
      setSelectedPlays(autoSelected);
      
      if (onPlaysExtracted) {
        onPlaysExtracted(plays);
      }
      
    } catch (error) {
      console.error('Error extracting plays:', error);
      alert('Error extracting plays from PDF. The PDF might be corrupted or unsupported.');
    } finally {
      setExtracting(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  const uploadPlayImage = async (imageDataUrl: string, playCode: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const fileName = `${teamId}/play_images/${playCode}.png`;
      const { data, error } = await supabase.storage
        .from('playbooks')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('playbooks')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading play image:', error);
      return null;
    }
  };

  const saveSelectedPlays = async () => {
    const playsToSave = extractedPlays.filter(play => selectedPlays.has(play.name));
    
    if (playsToSave.length === 0) {
      alert('Please select at least one play to save');
      return;
    }

    try {
      // Get the next available play codes
      const { data: existingPlays } = await supabase
        .from('playbook_plays')
        .select('play_code')
        .eq('team_id', teamId)
        .order('play_code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPlays && existingPlays.length > 0) {
        const lastCode = existingPlays[0].play_code;
        const match = lastCode.match(/P-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Prepare plays for insertion with image upload
      const newPlays = [];
      
      for (let i = 0; i < playsToSave.length; i++) {
        const play = playsToSave[i];
        const playCode = `P-${String(nextNumber + i).padStart(3, '0')}`;
        
        // Upload play image if available
        let imageUrl = null;
        if (play.imageDataUrl) {
          imageUrl = await uploadPlayImage(play.imageDataUrl, playCode);
        }
        
        newPlays.push({
          team_id: teamId,
          play_name: play.name,
          play_code: playCode,
          page_number: play.pageNumber,
          extraction_confidence: play.confidence,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        });
      }

      const { error } = await supabase
        .from('playbook_plays')
        .insert(newPlays);

      if (error) throw error;

      alert(`Successfully added ${playsToSave.length} plays with images to your playbook!`);
      setExtractedPlays([]);
      setSelectedPlays(new Set());
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error('Error saving plays:', error);
      alert('Error saving plays to database. Please try again.');
    }
  };

  const togglePlaySelection = (playName: string) => {
    const newSelected = new Set(selectedPlays);
    if (newSelected.has(playName)) {
      newSelected.delete(playName);
    } else {
      newSelected.add(playName);
    }
    setSelectedPlays(newSelected);
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Upload Playbook PDF
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                PDF files up to 10MB - includes images and text extraction
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading || extracting}
              className="sr-only"
            />
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {(uploading || extracting) && progress.total > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">{progress.message}</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Extracted Plays with Images */}
      {extractedPlays.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Extracted Plays with Images ({extractedPlays.length} found)
            </h3>
            <div className="text-sm text-gray-500">
              {selectedPlays.size} of {extractedPlays.length} selected
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {extractedPlays.map((play, index) => (
              <div key={index} className={`border rounded-lg overflow-hidden ${getConfidenceColor(play.confidence)}`}>
                {/* Play Image */}
                {play.imageDataUrl && (
                  <div className="aspect-video bg-gray-100">
                    <img 
                      src={play.imageDataUrl} 
                      alt={`Play: ${play.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                {/* Play Info */}
                <div className="p-3">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlays.has(play.name)}
                      onChange={() => togglePlaySelection(play.name)}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{play.name}</div>
                      <div className="text-xs opacity-75 mt-1">
                        Page {play.pageNumber} • {play.confidence} confidence
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={saveSelectedPlays}
              disabled={selectedPlays.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Save {selectedPlays.size} Selected Plays
            </button>
          </div>
        </div>
      )}
    </div>
  );
}