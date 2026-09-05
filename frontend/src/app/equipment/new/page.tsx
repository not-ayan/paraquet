'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Info,
  Camera,
  Wrench,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { apiClient, getFallbackImage } from '@/lib/api';
import { EquipmentCategory } from '@/lib/types';

export default function NewEquipmentPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('Cameras & Video');
  const [location, setLocation] = useState('Central Media Lab (Room 201)');
  const [currentCondition, setCurrentCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR'>('EXCELLENT');
  const [maxBorrowDays, setMaxBorrowDays] = useState(3);
  
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: 'Included Accessories', value: 'Carrying case, 2 batteries, dual charger' },
    { key: 'Compatibility', value: 'Standard tripod mount, USB-C charge' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const categories: EquipmentCategory[] = [
    'Cameras & Video',
    'Audio & Sound',
    'Workshop & Tools',
    'Projectors & Displays',
    'Laptops & Computing',
    'Outdoors & Sports',
    'Music & Instruments',
  ];

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setIsSubmitting(true);

    const specObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    const fallbackImg = getFallbackImage(name, category);

    await apiClient.createEquipment({
      name,
      description,
      category,
      location,
      images: images.length > 0 ? images : [fallbackImg],
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      
      {/* Back Link */}
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#70706B] hover:text-[#111110] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Equipment Catalog
      </Link>

      {/* Header */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
          Contribution
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111110] tracking-tight">
          List Campus Equipment
        </h1>
        <p className="text-xs sm:text-sm text-[#70706B]">
          Make idle maker tools, cameras, and audio arrays available to verified campus students and creators.
        </p>
      </div>

      {createdSuccess ? (
        <div className="rounded-[32px] border border-[#A7F3D0] p-10 sm:p-12 text-center space-y-3.5 bg-[#E8F5EB] animate-in zoom-in-95 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-[#1B7A42] mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B7A42]">
            Listing Submitted for Moderation!
          </h2>
          <p className="text-xs sm:text-sm text-[#1B7A42]/90 max-w-md mx-auto leading-relaxed">
            Your item and photos have been received in the <strong>submitted</strong> holding queue pending administrator verification.
          </p>
          <span className="text-xs text-[#70706B] block">
            Redirecting to your dashboard...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E5E0] bg-white p-6 sm:p-10 space-y-7 shadow-xs">
          
          {/* Moderation Note */}
          <div className="p-4 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl flex items-start gap-3 text-xs text-[#70706B]">
            <Info className="w-4 h-4 text-[#111110] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#111110] block mb-0.5">Automated Moderation & Cloudinary Routing</strong>
              New submissions are stored in Cloudinary folder <code className="bg-white px-1.5 py-0.5 rounded-md font-mono text-[#B25E09] border border-[#E5E5E0]">submitted/</code> with status <span className="font-semibold text-[#B25E09]">PENDING</span>. Upon admin approval, photos move to <code className="bg-white px-1.5 py-0.5 rounded-md font-mono text-[#1B7A42] border border-[#E5E5E0]">approved/</code>.
            </div>
          </div>

          {/* 1. Name */}
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

          {/* 2. Category & Location */}
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
                placeholder="e.g. Media Lab Room 204"
                className="input-paraquet rounded-2xl h-[46px] text-xs sm:text-sm font-semibold"
              />
            </div>
          </div>

          {/* 3. Description */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
              Description & Handling Guidelines *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the hardware condition, what cables and accessories are included, and handling guidelines..."
              className="input-paraquet rounded-2xl text-xs sm:text-sm resize-none"
            />
          </div>

          {/* 4. Condition & Max Borrow Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* 5. Photos */}
          <div className="space-y-2.5 pt-2 border-t border-[#E5E5E0]">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                Equipment Photos (Cloudinary Upload)
              </label>
              <span className="text-[11px] text-[#70706B]">Folder: <code className="bg-[#F5F5F3] px-1 py-0.5 rounded text-[10px]">submitted/</code></span>
            </div>

            {/* Direct File Picker & URL Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 px-4 h-[46px] border-2 border-dashed border-[#E5E5E0] hover:border-[#111110] rounded-2xl bg-[#F8F8F6] hover:bg-white cursor-pointer transition-colors text-xs sm:text-sm font-bold text-[#111110] active:scale-98">
                <Upload className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{isUploadingImage ? 'Uploading to Cloudinary...' : 'Upload Photo File'}</span>
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
                  className="input-paraquet rounded-2xl text-xs sm:text-sm flex-grow h-[46px]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="btn-secondary text-xs px-4 h-[46px] rounded-2xl whitespace-nowrap active:scale-95"
                >
                  Add URL
                </button>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-[#DC2626]">{uploadError}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-2xl overflow-hidden bg-[#F8F8F6] border border-[#E5E5E0] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Technical Specs */}
          <div className="space-y-3 pt-2 border-t border-[#E5E5E0]">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                Technical Specs & Accessories
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs text-[#111110] font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {specs.map((s, idx) => (
              <div key={idx} className="flex gap-2.5 items-center">
                <input
                  type="text"
                  placeholder="Key (e.g. Sensor)"
                  value={s.key}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].key = e.target.value;
                    setSpecs(copy);
                  }}
                  className="input-paraquet rounded-2xl text-xs sm:text-sm w-1/3 min-w-0 h-[44px]"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Full Frame 4K)"
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
                  className="p-2 text-[#70706B] hover:text-[#DC2626] flex-shrink-0 transition-colors"
                  title="Remove Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E0]">
            <Link href="/equipment" className="btn-secondary rounded-full px-5 py-2.5 text-xs sm:text-sm">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary rounded-full px-6 py-2.5 text-xs sm:text-sm shadow-xs"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Equipment Listing ↗'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
