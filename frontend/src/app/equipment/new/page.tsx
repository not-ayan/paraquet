'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Info
} from 'lucide-react';
import { CommuneStore } from '@/lib/store';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const specObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    CommuneStore.createEquipment({
      name,
      description,
      category,
      location,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'],
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
    <div className="container-custom py-8 sm:py-12 max-w-3xl space-y-6">
      
      {/* Back Link */}
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-fluid-body font-semibold text-[#70706B] hover:text-[#111110] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-fluid-h1 font-bold text-[#111110]">
          List Equipment
        </h1>
        <p className="text-fluid-body text-[#70706B]">
          Make idle tools and cameras available to verified campus students and creators.
        </p>
      </div>

      {createdSuccess ? (
        <div className="card-paraquet p-10 text-center space-y-3 bg-[#E8F5EB] border-transparent animate-in zoom-in-95">
          <CheckCircle2 className="w-12 h-12 text-[#1B7A42] mx-auto" />
          <h2 className="text-fluid-h2 font-bold text-[#1B7A42]">
            Listing Submitted for Moderation!
          </h2>
          <p className="text-fluid-body text-[#1B7A42]/90 max-w-md mx-auto">
            Your item is currently <strong>PENDING</strong> administrator verification before appearing in the public catalog.
          </p>
          <span className="text-fluid-micro text-[#70706B] block">
            Redirecting to dashboard...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-paraquet p-6 sm:p-8 space-y-6">
          
          <div className="p-4 bg-[#EDEDEA] rounded-2xl flex items-start gap-3 text-fluid-micro text-[#70706B]">
            <Info className="w-4 h-4 text-[#111110] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#111110] block mb-0.5">Automated Moderation Notice</strong>
              New submissions automatically receive status <span className="font-semibold text-[#B25E09]">PENDING</span> and <span className="font-semibold text-[#DC2626]">UNAVAILABLE</span> until approved by an administrator.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony Alpha A7 IV Mirrorless Camera"
              className="input-paraquet text-fluid-body"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="input-paraquet text-fluid-body font-medium cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Pickup / Lab Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Media Lab Room 204"
                className="input-paraquet text-fluid-body"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
              Description & Handling Instructions *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item condition, what accessories are included, and handling guidelines..."
              className="input-paraquet text-fluid-body resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Current Physical Condition
              </label>
              <select
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value as 'EXCELLENT' | 'GOOD' | 'FAIR')}
                className="input-paraquet text-fluid-body font-medium cursor-pointer"
              >
                <option value="EXCELLENT">EXCELLENT (Like new / flawless)</option>
                <option value="GOOD">GOOD (Minor cosmetic wear)</option>
                <option value="FAIR">FAIR (Functional with visible wear)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Max Recommended Loan (Days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={maxBorrowDays}
                onChange={(e) => setMaxBorrowDays(parseInt(e.target.value) || 3)}
                className="input-paraquet text-fluid-body"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2.5">
            <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
              Photos (URLs)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL (https://images.unsplash.com/...)"
                className="input-paraquet text-fluid-body"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="btn-secondary text-xs px-4 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-[#EDEDEA] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-3 pt-2 border-t border-[#E2E2DE]">
            <div className="flex items-center justify-between">
              <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                Technical Specs & Accessories
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-fluid-micro text-[#111110] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {specs.map((s, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Key (e.g. Sensor)"
                  value={s.key}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].key = e.target.value;
                    setSpecs(copy);
                  }}
                  className="input-paraquet text-fluid-body w-1/3"
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
                  className="input-paraquet text-fluid-body flex-grow"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-2 text-[#70706B] hover:text-[#DC2626]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E2E2DE]">
            <Link href="/equipment" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing →'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
