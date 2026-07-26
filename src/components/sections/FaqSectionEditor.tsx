"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, GripVertical, Settings, HelpCircle, Check, X } from "lucide-react";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FaqItem } from "@/features/home/actions";
import { GlobalSettings } from "@/features/settings/actions";

interface FaqSectionEditorProps {
  config: any;
  onUpdate: (field: string, value: any) => void;
  onUpdateItems: (items: FaqItem[]) => void;
  globalSettings?: GlobalSettings;
}

export function FaqSectionEditor({
  config,
  onUpdate,
  onUpdateItems,
  globalSettings
}: FaqSectionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FaqItem>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const items: FaqItem[] = config?.items || [];
  const primaryColor = globalSettings?.primaryColor || "#f59e0b";

  const handleStartEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const updated = items.map(item =>
      item.id === editingId ? ({ ...item, ...editForm } as FaqItem) : item
    );
    onUpdateItems(updated);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("האם למחוק שאלה זו?")) {
      const filtered = items.filter(item => item.id !== id);
      onUpdateItems(filtered);
    }
  };

  const handleAddNewItem = () => {
    if (!newQuestion.trim()) return;
    const newItem: FaqItem = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim() || "תשובה לדוגמה",
      isVisible: true
    };
    onUpdateItems([...items, newItem]);
    setNewQuestion("");
    setNewAnswer("");
    setIsAddingNew(false);
  };

  const handleReorder = (newItems: FaqItem[]) => {
    onUpdateItems(newItems);
  };

  return (
    <div className="w-full relative z-50 text-start" dir="rtl">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: primaryColor }} />
          <span>הגדרות אזור שאלות ותשובות</span>
        </h3>
      </div>

      {/* General Settings */}
      <div className="flex flex-col gap-5 mb-8 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">כותרת ראשית</label>
          <input
            type="text"
            className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-3 focus:outline-none focus:border-amber-500"
            value={config?.title || ""}
            onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="שאלות ותשובות נפוצות"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">תת כותרת</label>
          <input
            type="text"
            className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-3 focus:outline-none focus:border-amber-500"
            value={config?.subtitle || ""}
            onChange={(e) => onUpdate("subtitle", e.target.value)}
            placeholder="תיאור קצר מתחת לכותרת"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">מזהה עוגן (Anchor ID)</label>
            <input
              type="text"
              className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-3 focus:outline-none focus:border-amber-500 text-left" dir="ltr"
              value={config?.anchorId || "faq"}
              onChange={(e) => onUpdate("anchorId", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">צבע רקע אזור</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded border border-slate-700 bg-[#1e293b] cursor-pointer"
                value={config?.backgroundColor || globalSettings?.backgroundColor || "#0e0e10"}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
              />
              <input
                type="text"
                className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-2.5 focus:outline-none focus:border-amber-500 text-left" dir="ltr"
                value={config?.backgroundColor || ""}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                placeholder="שקוף / ברירת מחדל"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>ניהול שאלות ותשובות ({items.length})</span>
        </h4>
        
        {!isAddingNew && (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף שאלה</span>
          </Button>
        )}
      </div>

      {/* Form: Add New Question */}
      {isAddingNew && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-amber-500/40 space-y-4">
          <h5 className="text-xs font-bold text-amber-400">הוספת שאלה חדשה</h5>
          <div>
            <label className="block text-xs text-slate-400 mb-1">השאלה</label>
            <input
              type="text"
              className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="רשום את השאלה כאן..."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">התשובה</label>
            <textarea
              rows={3}
              className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-2.5 focus:outline-none focus:border-amber-500 resize-none"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="רשום את התשובה המפורטת כאן..."
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(false)}
              className="text-xs border-slate-700 text-slate-300"
            >
              ביטול
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNewItem}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
            >
              שמור שאלה
            </Button>
          </div>
        </div>
      )}

      {/* Items List - Drag & Drop Reorder */}
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm"
          >
            {editingId === item.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">השאלה</label>
                  <input
                    type="text"
                    className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                    value={editForm.question || ""}
                    onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">התשובה</label>
                  <textarea
                    rows={3}
                    className="w-full text-sm border border-slate-700 bg-[#1e293b] text-white rounded-lg p-2.5 focus:outline-none focus:border-amber-500 resize-none"
                    value={editForm.answer || ""}
                    onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="ביטול"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    title="שמור"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 pt-1 shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-white truncate">{item.question}</h5>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.answer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-800"
                    title="ערוך"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
