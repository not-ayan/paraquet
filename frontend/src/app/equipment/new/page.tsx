'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Camera,
  Wrench,
  ShieldCheck,
  Upload,
  Clock,
  MapPin,
  Sparkles,
  Layers,
  FileText,
  Eye,
  Info
} from 'lucide-react';
import { apiClient, getFallbackImage } from '@/lib/api';
import { EquipmentCategory } from '@/lib/types';

export default function NewEquipmentPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('Cameras & Video');
  const [location, setLocation] = useState('');
  const [currentCondition, setCurrentCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR'>('EXCELLENT');
  const [maxBorrowDays, setMaxBorrowDays] = useState(3);
  
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categories: EquipmentCategory[] = [
    'Cameras & Video',
    'Audio & Sound',
    'Workshop & Tools',
    'Projectors & Displays',
    'Laptops & Computing',
    'Outdoors & Sports',
    'Music & Instruments',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const url = await apiClient.uploadImage(file, 'submitted');
      setImages((prev) => [...prev, url]);
    } catch (err: any) {
      console.warn('Cloudinary upload error:', err);
      const localUrl = URL.createObjectURL(file);
      setImages((prev) => [...prev, localUrl]);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const specObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    const fallbackImg = getFallbackImage(name, category);
    const finalImages = images.length > 0 ? images : [fallbackImg];

    await apiClient.createEquipment({
      name: name.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      images: finalImages,
      currentCondition,
      specs: specObj,
      maxBorrowDays,
    });

    setIsSubmitting(false);
    setCreatedSuccess(true);

    setTimeout(() => {
      router.push('/dashboard');
    }, 1800);
  };

  const previewImage = images[0] || null;

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
        <div className="space-y-1.5">
          <Link
            href="/equipment"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#70706B] hover:text-[#111110] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Equipment Catalog
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111110] tracking-tight">
            List Equipment for Loan
          </h1>
          <p className="text-xs sm:text-sm text-[#70706B]">
            Make maker tools, cameras, and lab hardware available to students and creators at Tezpur University, Assam.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5F5F3] text-[#70706B] border border-[#E5E5E0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B7A42]" /> Community Peer Lending
          </span>
        </div>
      </div>

      {createdSuccess ? (
        <div className="rounded-[32px] border border-[#A7F3D0] p-10 sm:p-16 text-center space-y-4 bg-[#E8F5EB] animate-in zoom-in-95 shadow-sm max-w-2xl mx-auto my-12">
          <CheckCircle2 className="w-16 h-16 text-[#1B7A42] mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B7A42]">
            Listing Submitted for Review!
          </h2>
          <p className="text-sm text-[#1B7A42]/90 max-w-md mx-auto leading-relaxed">
            Your item <strong>&ldquo;{name}&rdquo;</strong> has been recorded and submitted for administrator verification.
          </p>
          <p className="text-xs text-[#70706B] pt-2">
            Redirecting to your dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Details & Specifications (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Primary Info Card */}
              <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0EE]">
                  <Layers className="w-4 h-4 text-[#111110]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#111110]">
                    Equipment Details
                  </h2>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sony Alpha A7 IV Mirrorless Camera"
                    className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold"
                  />
                </div>

                {/* Category & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                      className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                      Pickup / Lab Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Tezpur University, Assam (Central Lab)"
                      className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                    Description & Handling Guidelines *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the hardware, lens mount, required cables, and handling instructions for students..."
                    className="input-paraquet rounded-2xl text-xs sm:text-sm resize-none"
                  />
                </div>

                {/* Condition & Max Borrow Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0F0EE]">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                      Current Physical Condition
                    </label>
                    <select
                      value={currentCondition}
                      onChange={(e) => setCurrentCondition(e.target.value as 'EXCELLENT' | 'GOOD' | 'FAIR')}
                      className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <option value="EXCELLENT">EXCELLENT (Like new / flawless)</option>
                      <option value="GOOD">GOOD (Minor cosmetic wear)</option>
                      <option value="FAIR">FAIR (Functional with visible wear)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                      Max Recommended Loan (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={maxBorrowDays}
                      onChange={(e) => setMaxBorrowDays(parseInt(e.target.value) || 3)}
                      className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Specifications Card */}
              <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#111110]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#111110]">
                      Technical Specifications & Included Items
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs text-[#111110] font-bold hover:underline flex items-center gap-1 bg-[#F5F5F3] hover:bg-[#EDEDEA] px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {specs.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-dashed border-[#E5E5E0] text-center text-xs text-[#70706B]">
                      No custom specifications added yet. Click &ldquo;+ Add Field&rdquo; above to include accessories or hardware specs.
                    </div>
                  ) : (
                    specs.map((s, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center">
                        <input
                          type="text"
                          placeholder="Feature / Key (e.g. Resolution)"
                          value={s.key}
                          onChange={(e) => {
                            const copy = [...specs];
                            copy[idx].key = e.target.value;
                            setSpecs(copy);
                          }}
                          className="input-paraquet rounded-2xl text-xs sm:text-sm w-2/5 min-w-0 h-[44px] font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Specification (e.g. 4K 60fps ProRes)"
                          value={s.value}
                          onChange={(e) => {
                            const copy = [...specs];
                            copy[idx].value = e.target.value;
                            setSpecs(copy);
                          }}
                          className="input-paraquet rounded-2xl text-xs sm:text-sm flex-grow min-w-0 h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(idx)}
                          className="p-2.5 text-[#70706B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl flex-shrink-0 transition-colors"
                          title="Remove Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Photos, Live Card Preview & Submission (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Cloudinary Photo Upload Card */}
              <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#111110]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#111110]">
                      Equipment Photos
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[#70706B]">
                    {images.length} {images.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>

                {/* Upload & URL Input */}
                <div className="space-y-3">
                  <label className="flex items-center justify-center gap-2 px-4 h-[48px] border-2 border-dashed border-[#E5E5E0] hover:border-[#111110] rounded-2xl bg-[#F8F8F6] hover:bg-white cursor-pointer transition-all text-xs sm:text-sm font-bold text-[#111110] active:scale-98">
                    <Upload className="w-4 h-4 flex-shrink-0 text-[#111110]" />
                    <span className="truncate">{isUploadingImage ? 'Uploading photo...' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="input-paraquet rounded-2xl text-xs flex-grow h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="btn-secondary text-xs px-4 h-[44px] rounded-2xl whitespace-nowrap active:scale-95"
                    >
                      Add URL
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-xs text-[#DC2626]">{uploadError}</p>
                  )}
                </div>

                {/* Thumbnails Gallery */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F8F6] border border-[#E5E5E0] group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white uppercase tracking-wider">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-[#DC2626] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-dashed border-[#E5E5E0] text-center text-xs text-[#70706B]">
                    No photos uploaded yet. Upload a photo or paste a URL above.
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#70706B]">
                  <Eye className="w-3.5 h-3.5 text-[#111110]" />
                  <span>Live Catalog Card Preview</span>
                </div>

                <div className="rounded-2xl border border-[#E5E5E0] overflow-hidden bg-[#F8F8F6]">
                  <div className="relative aspect-video w-full bg-[#F5F5F3] border-b border-[#E5E5E0] overflow-hidden">
                    {previewImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={previewImage} 
                        alt={name || 'Equipment Preview'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8E88] gap-1.5 p-4 text-center bg-[#F8F8F6]">
                        <div className="w-9 h-9 rounded-xl bg-[#EDEDEA] flex items-center justify-center text-[#70706B]">
                          <Upload className="w-4 h-4 text-[#70706B]" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#70706B]">No Photo Uploaded</span>
                        <span className="text-[10px] text-[#A8A8A2]">Photo preview will appear here</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-[#111110] backdrop-blur-xs shadow-2xs">
                        {category}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#111110]/80 text-white backdrop-blur-xs">
                        Max {maxBorrowDays}d
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 bg-white">
                    <h3 className="font-bold text-sm text-[#111110] line-clamp-1">
                      {name || 'Equipment Title Preview'}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-[#70706B] pt-1 border-t border-[#F0F0EE]">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-[#E11D48] flex-shrink-0" />
                        <span className="truncate">{location || 'Tezpur University, Assam'}</span>
                      </span>
                      <span className="font-bold text-[#1B7A42] bg-[#E8F5EB] px-2 py-0.5 rounded-full flex-shrink-0">
                        ₹0 Free Loan
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 space-y-3 shadow-2xs">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-98 ${
                    !isSubmitting && name.trim()
                      ? 'btn-primary'
                      : 'inline-flex items-center justify-center bg-[#EDEDEA] text-[#9C9C96] border border-[#E5E5E0] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Submitting Equipment...' : 'Submit Equipment Listing ↗'}
                </button>

                <Link
                  href="/equipment"
                  className="btn-secondary w-full py-3 rounded-full text-xs font-semibold block text-center"
                >
                  Cancel
                </Link>

                <p className="text-center text-[11px] text-[#70706B] pt-1">
                  Verified equipment will appear in the catalog after review.
                </p>
              </div>

            </div>

          </div>
        </form>
      )}

    </div>
  );
}
