"use client";

import React, { useState } from "react";
import { Image, X, Plus, GripVertical, FormInput, Grid3x3, ChevronDown, ChevronUp, Monitor, Smartphone, Layout, Copy } from "lucide-react";
import { Reorder } from "framer-motion";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { CRMFormBuilder, type FormConfig } from "@/features/crm/components/CRMFormBuilder";

export interface ImageListingItem {
  url: string;
  form?: FormConfig;
}

interface ImageListingEditorProps {
  config: any;
  onChange: (config: any) => void;
}

export function ImageListingEditor({ config, onChange }: ImageListingEditorProps) {
  const [editingFormIndex, setEditingFormIndex] = useState<number | null>(null);
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);

  // Normalize images to always be objects
  const images: ImageListingItem[] = (config.images || []).map((img: any) => {
    if (typeof img === "string") return { url: img };
    return img;
  });

  const updateField = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleUpdateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], url };
    updateField("images", newImages);
  };

  const handleUpdateForm = (index: number, form: FormConfig) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], form };
    updateField("images", newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    updateField("images", newImages);
    if (editingFormIndex === index) setEditingFormIndex(null);
  };

  const handleDuplicateImage = (index: number) => {
    const newImages = [...images];
    const itemToDuplicate = JSON.parse(JSON.stringify(newImages[index])); // Deep copy
    newImages.splice(index + 1, 0, itemToDuplicate);
    updateField("images", newImages);
  };

  const handleReorder = (newOrder: ImageListingItem[]) => {
    updateField("images", newOrder);
  };

  const handleAddMultiple = (urls: any) => {
    const urlsArray = Array.isArray(urls) ? urls : [urls];
    const newItems = urlsArray.map((url: string) => ({ url }));
    updateField("images", [...images, ...newItems]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="w-full">
        <div className="space-y-6">
          <div className="bg-[#181818] rounded-xl border border-white/10 overflow-hidden">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#1a1a20] transition-colors"
              onClick={() => setIsLayoutExpanded(!isLayoutExpanded)}
            >
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-white text-lg">פריסה</h3>
              </div>
              
              <div className="flex items-center gap-4">
                {!isLayoutExpanded && (
                  <div className="flex items-center gap-1 border border-white/10 bg-[#111] px-2 py-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const current = config.imagesPerRow || 4;
                        const next = current >= 6 ? 1 : current + 1;
                        updateField("imagesPerRow", next);
                      }}
                      className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
                      title="לחץ לשינוי עמודות במסך רחב"
                    >
                      <span className="text-white font-mono">{config.imagesPerRow || 4}</span>
                      <Monitor className="w-4 h-4 text-amber-500" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const current = config.imagesPerRowMobile || 1;
                        const next = current >= 3 ? 1 : current + 1;
                        updateField("imagesPerRowMobile", next);
                      }}
                      className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
                      title="לחץ לשינוי עמודות בנייד"
                    >
                      <span className="text-white font-mono">{config.imagesPerRowMobile || 1}</span>
                      <Smartphone className="w-4 h-4 text-amber-500" />
                    </button>
                  </div>
                )}
                <div className="text-slate-400">
                  {isLayoutExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>
            
            {isLayoutExpanded && (
              <div className="p-5 border-t border-white/10 space-y-6 bg-[#111]">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-amber-500" /> עמודות במסך רחב
                    </label>
                    <select
                      value={config.imagesPerRow || 4}
                      onChange={(e) => updateField("imagesPerRow", Number(e.target.value))}
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} עמודות</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-500" /> עמודות בנייד
                    </label>
                    <select
                      value={config.imagesPerRowMobile || 1}
                      onChange={(e) => updateField("imagesPerRowMobile", Number(e.target.value))}
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    >
                      {[1, 2, 3].map(num => (
                        <option key={num} value={num}>{num} עמודות</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">צבע רקע האזור</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.backgroundColor || "#ffffff"}
                      onChange={(e) => updateField("backgroundColor", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-[#181818] border border-white/10 p-1"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor || "#ffffff"}
                      onChange={(e) => updateField("backgroundColor", e.target.value)}
                      className="bg-[#181818] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm uppercase flex-1 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-transparent p-0 space-y-4">
             <div className="flex items-center justify-between bg-[#181818] border border-white/5 rounded-xl p-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-amber-500" /> הגדרת תוכן (תמונות וטפסים)
                </h3>
                <div className="flex items-center gap-2">
                  <ImageUpload 
                    multiple 
                    onSelect={handleAddMultiple} 
                    customTrigger={(onClick) => (
                      <button
                        onClick={onClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] text-amber-500 hover:bg-[#333] border border-white/10 rounded-lg text-sm font-bold transition-all"
                      >
                        <Plus className="w-4 h-4" /> הוסף תמונות
                      </button>
                    )}
                  />
                </div>
             </div>

              <div className="space-y-4">
                {images.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-[#0f172a] rounded-lg border border-dashed border-slate-700">
                    לא נבחרו תמונות. לחץ על 'הוסף תמונות' למעלה.
                  </div>
                ) : (
                  <Reorder.Group 
                    axis="y" 
                    values={images} 
                    onReorder={handleReorder}
                    className="space-y-3"
                  >
                    {images.map((img: ImageListingItem, index: number) => (
                      <Reorder.Item 
                        key={img.url + index} 
                        value={img} 
                        className="flex flex-col bg-[#111] rounded-xl border border-white/5 relative overflow-hidden"
                      >
                        <div className="flex flex-col gap-4 p-4 group relative">
                          <div className="flex items-center gap-4">
                            <div className="text-slate-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors shrink-0">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                              <ImageUpload
                                currentImage={img.url}
                                onSelect={(url) => handleUpdateImage(index, url)}
                                size="sm"
                              />
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => setEditingFormIndex(editingFormIndex === index ? null : index)}
                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 w-fit ${
                                editingFormIndex === index || (img.form && img.form.enabled)
                                  ? "bg-amber-500 text-black hover:bg-amber-400 border border-amber-400"
                                  : "bg-[#222] text-slate-300 hover:bg-[#333] hover:text-white border border-white/10"
                              }`}
                            >
                              <FormInput className="w-4 h-4" /> 
                              {img.form && img.form.enabled ? 'ערוך טופס ספציפי' : 'הוסף טופס'}
                              {editingFormIndex === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          <div className="absolute left-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                              title="הסר תמונה"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateImage(index)}
                              className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                              title="שכפל תמונה וטופס"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {editingFormIndex === index && (
                          <div className="p-0 border-t border-white/5 bg-[#181818] overflow-hidden">
                            <CRMFormBuilder 
                              value={(img.form || { enabled: true, fields: [], form_type: "standard" }) as any} 
                              onChange={(newForm) => handleUpdateForm(index, newForm)} 
                            />
                          </div>
                        )}
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
