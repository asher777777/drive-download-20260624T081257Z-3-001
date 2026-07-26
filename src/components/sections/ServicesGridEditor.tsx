"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { Plus, Trash2, Edit2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IconPicker } from "@/components/ui/IconPicker";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ServiceItem, getAllSitePages } from "@/features/home/actions";
import { cn } from "@/lib/utils";
import { Loader2, Wand2 } from "lucide-react";

interface ServicesGridEditorProps {
  items: ServiceItem[];
  onUpdate: (newItems: ServiceItem[]) => void;
}

const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.FileQuestion;
};

export function ServicesGridEditor({ items, onUpdate }: ServicesGridEditorProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceItem>>({});
  const [availablePages, setAvailablePages] = useState<any[]>([]);

  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPageType, setAiPageType] = useState<"service" | "landing" | "post">("service");
  const [aiGenerateImages, setAiGenerateImages] = useState(true);

  useEffect(() => {
    getAllSitePages().then(setAvailablePages).catch((e) => console.warn("Failed to load site pages", e));
  }, []);

  const handlePageSelect = (pageUrl: string) => {
    const page = availablePages.find(p => p.url === pageUrl);
    if (page) {
      setEditForm({
        ...editForm,
        title: page.title,
        description: page.description,
        url: page.url,
        icon: page.icon,
        imageSrc: page.imageSrc
      });
    }
  };

  const handleGeneratePage = async () => {
    if (!editForm.title) {
      alert("נא להזין לפחות כותרת לשירות");
      return;
    }
    setIsGenerating(true);
    try {
      const { generatePageWithAI } = await import("@/features/services/actions");
      const prompt = `צור דף שמתאר את השירות הבא:\nכותרת: ${editForm.title}\nתיאור: ${editForm.description || ""}`;
      const slug = `service-${Date.now()}`;
      
      const res = await generatePageWithAI(
        prompt, 
        slug, 
        aiPageType, 
        "רגיל", 
        "לקוחות פוטנציאליים", 
        ['hero', 'richContent', 'contact'], 
        "", 
        "", 
        aiGenerateImages
      );
      
      if (res.success) {
        setEditForm({ ...editForm, url: `/${aiPageType === 'post' ? 'post' : 'service'}/${slug}` });
        setShowAIGenerator(false);
        alert("העמוד נוצר בהצלחה! הקישור עודכן.");
      } else {
        alert("שגיאה ביצירת עמוד: " + res.error);
      }
    } catch (err: any) {
      alert("שגיאה בשרת: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItem = () => {
    if (editingItemId === "new") {
      const newItem: ServiceItem = {
        id: Date.now().toString(),
        title: editForm.title || "שירות חדש",
        description: editForm.description || "",
        url: editForm.url || "/",
        icon: editForm.icon || "Star",
        isVisible: true
      };
      onUpdate([...items, newItem]);
    } else {
      const updated = items.map((item: any) => item.id === editingItemId ? { ...item, ...editForm } as ServiceItem : item);
      onUpdate(updated);
    }
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("האם למחוק פריט זה?")) {
      onUpdate(items.filter(item => item.id !== id));
    }
  };

  const handleToggleVisibility = (id: string) => {
    onUpdate(items.map((item: any) => item.isVisible === undefined ? { ...item, isVisible: false } : item.id === id ? { ...item, isVisible: !item.isVisible } : item));
  };

  return (
    <div className="max-w-4xl mx-auto mb-16 bg-white rounded-2xl shadow-xl p-6 border border-primary/20" dir="rtl">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <LucideIcons.Settings className="w-5 h-5" />
          ניהול שירותים ודפים
        </h3>
        <Button onClick={() => { setEditingItemId("new"); setEditForm({ icon: "Star" }); }} size="sm">
          <Plus className="w-4 h-4 ml-2" /> פריט חדש
        </Button>
      </div>

      {editingItemId && (
        <div className="bg-slate-50 p-6 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-2">
            <label className="block text-sm font-bold text-indigo-900 mb-2">ייבוא מעמוד קיים (אופציונלי)</label>
            <select 
              className="w-full border rounded-lg p-2 bg-white"
              onChange={(e) => handlePageSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>-- בחר עמוד כדי לשאוב את הנתונים שלו --</option>
              {availablePages.map((page, index) => (
                <option key={`${page.id}-${index}`} value={page.url}>{page.title} ({page.url})</option>
              ))}
            </select>
            <p className="text-xs text-indigo-500 mt-1">בחירה תשלוף אוטומטית כותרת, תיאור, קישור ותמונה ראשית (אם קיימת).</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">כותרת</label>
            <input type="text" className="w-full border rounded-lg p-2" value={editForm.title || ""} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">תיאור קצר</label>
            <input type="text" className="w-full border rounded-lg p-2" value={editForm.description || ""} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center justify-between">
              <span>קישור (URL)</span>
              <button 
                type="button" 
                onClick={() => setShowAIGenerator(!showAIGenerator)} 
                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold"
              >
                <Wand2 className="w-3 h-3" />
                ייצר עמוד ב-AI ✨
              </button>
            </label>
            <input type="text" className="w-full border rounded-lg p-2 text-left mb-2" dir="ltr" value={editForm.url || ""} onChange={(e) => setEditForm({...editForm, url: e.target.value})} />
            
            {showAIGenerator && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3 mt-2">
                <div className="text-xs font-bold text-amber-800">יצירת עמוד בעזרת AI</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-amber-700 mb-1">סוג העמוד</label>
                    <select 
                      value={aiPageType}
                      onChange={(e: any) => setAiPageType(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-amber-200 bg-white"
                    >
                      <option value="service">עמוד שירות</option>
                      <option value="landing">דף נחיתה</option>
                      <option value="post">פוסט/מאמר</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input 
                      type="checkbox" 
                      id="ai-gen-images" 
                      checked={aiGenerateImages} 
                      onChange={(e) => setAiGenerateImages(e.target.checked)} 
                    />
                    <label htmlFor="ai-gen-images" className="text-xs text-amber-800 cursor-pointer">הפק תמונות ב-AI</label>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs"
                  onClick={handleGeneratePage}
                  disabled={isGenerating}
                >
                  {isGenerating ? <><Loader2 className="w-3 h-3 ml-2 animate-spin" /> מייצר עמוד...</> : "ייצר עכשיו"}
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">בחירת אייקון</label>
            <IconPicker 
              value={editForm.icon || "Star"} 
              onChange={(icon) => setEditForm({...editForm, icon})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">תמונה ראשית (אופציונלי)</label>
            <ImageUpload 
              currentImage={editForm.imageSrc} 
              onSelect={(url) => setEditForm({...editForm, imageSrc: url})} 
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingItemId(null)}>ביטול</Button>
            <Button onClick={handleSaveItem}>שמור</Button>
          </div>
        </div>
      )}

      <Reorder.Group axis="y" values={items} onReorder={onUpdate} className="space-y-2">
        {items.map((item: any) => (
          <Reorder.Item key={item.id} value={item} className="flex items-center gap-4 bg-white border p-3 rounded-xl hover:shadow-md transition-shadow group">
            <GripVertical className="w-5 h-5 text-slate-300 cursor-grab" />
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              {(() => { const Icon = getIcon(item.icon); return <Icon className="w-5 h-5 text-primary" />; })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate" dir="auto">{item.title}</div>
              <div className="text-sm text-muted-foreground truncate" dir="ltr">{item.url}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleToggleVisibility(item.id)} className={cn("p-2 rounded-lg transition-colors", item.isVisible !== false ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100")}>
                {item.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => { setEditingItemId(item.id); setEditForm(item); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
