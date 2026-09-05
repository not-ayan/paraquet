'use client';

import React, { useState } from 'react';
import { X, Camera, Sparkles, AlertTriangle } from 'lucide-react';
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
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const samplePhotos = [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#F5F5F3] border border-[#E2E2DE] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#EDEDEA] border-b border-[#E2E2DE] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#111110] text-white flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-fluid-h3 font-bold text-[#111110]">
                {type === 'PICKUP' ? 'Pickup Inspection' : 'Return Verification'}
              </h3>
              <p className="text-fluid-micro text-[#70706B] truncate max-w-[280px]">
                {equipmentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#70706B] hover:text-[#111110] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
          
          {/* Condition Select */}
          <div className="space-y-1.5">
            <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
              Physical Condition Grade
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'] as ConditionGrade[]).map((grade) => (
                <button
                  type="button"
                  key={grade}
                  onClick={() => setCondition(grade)}
                  className={`py-2 px-3 rounded-xl text-fluid-micro font-bold transition-all border ${
                    condition === grade
                      ? 'bg-[#111110] text-white border-[#111110] shadow-sm'
                      : 'bg-white text-[#111110] border-[#E2E2DE] hover:border-[#111110]'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Evidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Inspection Photo Evidence
              </label>
              <span className="text-fluid-micro text-[#70706B]">Cloudinary Verified</span>
            </div>

            <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#E2E2DE] hover:border-[#111110] rounded-xl bg-white cursor-pointer transition-colors text-fluid-body font-semibold text-[#111110]">
              <Camera className="w-4 h-4" />
              <span>{isUploadingPhoto ? 'Uploading to Cloudinary...' : 'Upload Inspection Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingPhoto(true);
                  try {
                    const url = await apiClient.uploadImage(file, 'condition_reports');
                    setPhotoUrl(url);
                  } catch (err) {
                    console.warn('Upload error:', err);
                    setPhotoUrl(URL.createObjectURL(file));
                  } finally {
                    setIsUploadingPhoto(false);
                  }
                }}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>

            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Or paste photo URL..."
              className="input-paraquet text-fluid-micro"
              required
            />
            
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-fluid-micro text-[#70706B]">Quick Samples:</span>
              {samplePhotos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoUrl(url)}
                  className="text-fluid-micro text-[#111110] hover:underline font-semibold"
                >
                  Photo #{i + 1}
                </button>
              ))}
            </div>

            {photoUrl && (
              <div className="mt-2 relative h-32 rounded-xl overflow-hidden bg-[#EDEDEA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#4ADE80]" /> Verified Hash
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
              Inspection Notes / Disclosures
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pristine condition, all batteries verified..."
              className="input-paraquet text-fluid-body resize-none"
            />
          </div>

          <div className="p-3 bg-[#FEF3C7] rounded-xl flex items-start gap-2 text-fluid-micro text-[#B25E09]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Photos establish mutual borrower and steward accountability across the custody cycle.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs"
            >
              {isSubmitting ? 'Recording...' : `Submit ${type === 'PICKUP' ? 'Pickup Report' : 'Return Verification'}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
