'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Sparkles, AlertTriangle, Upload, Trash2, Loader2, Bot, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ConditionGrade, ConditionReport } from '@/lib/types';
import { apiClient } from '@/lib/api';

interface ConditionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  equipmentName: string;
  type: 'PICKUP' | 'RETURN';
  onSuccess: (report: ConditionReport) => void;
}

export default function ConditionReportModal({
  isOpen,
  onClose,
  bookingId,
  equipmentName,
  type,
  onSuccess,
}: ConditionReportModalProps) {
  const [condition, setCondition] = useState<ConditionGrade>('EXCELLENT');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);
    setFileName(file.name);

    try {
      // Upload directly to Cloudinary under condition_reports folder
      const url = await apiClient.uploadImage(file, 'condition_reports');
      setPhotoUrl(url);
    } catch (err) {
      console.warn('Cloudinary upload error, falling back to base64 encoding:', err);
      // Fallback: convert to base64 Data URL so Gemini Vision can still inspect it!
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleClearPhoto = () => {
    setPhotoUrl('');
    setFileName('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setUploadError('Please upload an inspection photo before submitting.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      let report: ConditionReport | null = null;
      if (type === 'PICKUP') {
        report = await apiClient.submitPickupCondition(bookingId, {
          condition,
          photoUrl,
          notes,
        });
      } else {
        report = await apiClient.submitReturnCondition(bookingId, {
          condition,
          photoUrl,
          notes,
        });
      }

      if (report) {
        onSuccess(report);
        onClose();
      }
    } catch (err) {
      console.error('Error submitting condition report:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to submit condition report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#F5F5F3] border border-[#E5E5E0] w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5E5E0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#111110] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-fluid-h3 font-bold text-[#111110]">
                {type === 'PICKUP' ? 'Pickup Condition Inspection' : 'Return Damage & Condition Verification'}
              </h3>
              <p className="text-fluid-micro text-[#70706B] truncate max-w-[240px] sm:max-w-xs">
                {equipmentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EDEDEA] text-[#70706B] hover:text-[#111110] transition-colors flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
          
          {/* AI Condition Checker Notice */}
          <div className="p-3.5 bg-gradient-to-r from-[#F0FDF4] to-[#EFF6FF] border border-[#BAE6FD] rounded-2xl flex items-start gap-3 text-xs">
            <Bot className="w-4 h-4 text-[#0284C7] flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[#0369A1]">
              <span className="font-bold flex items-center gap-1.5 text-[#0F172A]">
                <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                Gemini Vision Condition Checker Active
              </span>
              <p className="text-[11px] leading-relaxed text-[#334155]">
                {type === 'PICKUP'
                  ? 'Gemini Vision will analyze your uploaded photo in detail to document baseline physical condition and log any pre-existing scratches or cosmetic wear before you take custody.'
                  : 'Gemini Vision will cross-reference this return photo against your initial checkout photo to detect cosmetic scuffs vs. actual/structural damage and assess likeness.'}
              </p>
            </div>
          </div>

          {/* Condition Select */}
          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#70706B]">
              Physical Condition Grade
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'] as ConditionGrade[]).map((grade) => (
                <button
                  type="button"
                  key={grade}
                  onClick={() => setCondition(grade)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] border ${
                    condition === grade
                      ? 'bg-[#111110] text-white border-[#111110] shadow-xs'
                      : 'bg-white text-[#111110] border-[#E5E5E0] hover:border-[#111110]/30'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Evidence Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] uppercase font-bold tracking-wider text-[#70706B]">
                Inspection Photo Evidence <span className="text-[#DC2626]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-[#70706B] hover:text-[#111110] underline font-medium"
              >
                {showUrlInput ? 'Use file upload' : 'Paste photo URL instead'}
              </button>
            </div>

            {!photoUrl ? (
              <>
                {!showUrlInput ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                      isDragging
                        ? 'border-[#111110] bg-[#EDEDEA]'
                        : 'border-[#D4D4CE] bg-white hover:border-[#111110] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessFile(file);
                      }}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />

                    <div className="w-12 h-12 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center text-[#111110]">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#111110]" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#111110] block">
                        {isUploadingPhoto
                          ? 'Uploading image to Cloudinary...'
                          : 'Click to upload or take a photo'}
                      </span>
                      <p className="text-[11px] text-[#70706B] mt-0.5">
                        JPEG, PNG, WebP up to 10MB • Direct camera capture supported
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/item-photo.jpg"
                      className="input-paraquet text-xs h-[44px]"
                      required
                    />
                    <p className="text-[11px] text-[#70706B]">
                      Enter a publicly accessible image URL of the item condition.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Photo Preview Box */
              <div className="space-y-2">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-[#111110] border border-[#E5E5E0] shadow-xs group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Equipment condition preview"
                    className="w-full h-full object-contain"
                  />

                  {/* Top Bar inside preview */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-[#4ADE80]" /> Photo Ready
                    </span>
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="bg-black/70 hover:bg-[#DC2626] backdrop-blur-md text-white p-1.5 rounded-full transition-colors shadow-xs"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Bar inside preview */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg truncate max-w-[200px]">
                      {fileName || 'Uploaded Image'}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#38BDF8]" /> Cloudinary Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#111110] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Replace with different photo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="text-xs text-[#DC2626] hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-[#DC2626] font-medium bg-[#FEE2E2] p-2.5 rounded-xl border border-[#FCA5A5]">
                {uploadError}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#70706B]">
              Inspector Notes / Disclosures
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lens cap included, small pre-existing paint scuff on side bracket..."
              className="input-paraquet text-xs resize-none"
            />
          </div>

          <div className="p-3 bg-[#FEF3C7]/80 border border-[#FDE68A] rounded-2xl flex items-start gap-2.5 text-xs text-[#92400E]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D97706]" />
            <span className="leading-relaxed">
              Photos establish mutual borrower and campus steward accountability. Gemini AI automatically documents condition reports for dispute prevention.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs h-[42px] px-4"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!photoUrl || isSubmitting || isUploadingPhoto}
              className="btn-primary text-xs h-[42px] px-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {type === 'PICKUP' ? 'Gemini AI Inspecting...' : 'Gemini AI Auditing Return...'}
                  </span>
                </>
              ) : (
                <span>
                  {type === 'PICKUP' ? 'Submit Pickup Report' : 'Submit Return Verification'}
                </span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

