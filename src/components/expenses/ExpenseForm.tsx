"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Camera, Upload, Plus } from "lucide-react";
import imageCompression from "browser-image-compression";
import { uploadMediaFile } from "@/features/media/actions";

interface ExpenseFormProps {
  expenseTypes: string[];
  paymentMethods: string[];
  onSubmit: (data: any) => Promise<{ success: boolean; id?: any; error?: any } | void>;
  onAddOption: (type: "expenseType" | "paymentMethod", value: string) => Promise<{ success: boolean; error?: any } | void>;
}

export function ExpenseForm({ expenseTypes, paymentMethods, onSubmit, onAddOption }: ExpenseFormProps) {
  const [expenseType, setExpenseType] = useState("");
  const [newExpenseType, setNewExpenseType] = useState("");
  
  const [amount, setAmount] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, options);
      
      const formData = new FormData();
      formData.append("file", compressedFile, `receipt_${Date.now()}.webp`);
      
      const uploadRes = await uploadMediaFile(formData);
      if (uploadRes.success && uploadRes.url) {
        setReceiptUrl(uploadRes.url);
      } else {
        alert("שגיאה בהעלאת התמונה.");
      }
    } catch (error) {
      console.error(error);
      alert("שגיאה בכיווץ או העלאת התמונה.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddOption = async (type: "expenseType" | "paymentMethod", value: string) => {
    if (!value.trim()) return;
    await onAddOption(type, value.trim());
    if (type === "expenseType") {
      setExpenseType(value.trim());
      setNewExpenseType("");
    } else {
      setPaymentMethod(value.trim());
      setNewPaymentMethod("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseType && !newExpenseType) return alert("בחר סוג הוצאה");
    if (!amount) return alert("הזן סכום");
    if (!paymentMethod && !newPaymentMethod) return alert("בחר צורת תשלום");
    
    setIsSubmitting(true);
    try {
      let finalExpenseType = expenseType;
      let finalPaymentMethod = paymentMethod;

      if (expenseType === "other" && newExpenseType) {
        await handleAddOption("expenseType", newExpenseType);
        finalExpenseType = newExpenseType;
      }
      if (paymentMethod === "other" && newPaymentMethod) {
        await handleAddOption("paymentMethod", newPaymentMethod);
        finalPaymentMethod = newPaymentMethod;
      }

      await onSubmit({
        expenseType: finalExpenseType,
        amount: Number(amount),
        paymentMethod: finalPaymentMethod,
        purchaseDate,
        paymentDate,
        receiptUrl,
      });

      // Reset
      setExpenseType("");
      setAmount("");
      setPaymentMethod("");
      setReceiptUrl("");
    } catch (error) {
      console.error(error);
      alert("אירעה שגיאה בשמירה.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border shadow-sm" dir="rtl">
      <h2 className="text-xl font-bold text-primary mb-4">הוספת הוצאה חדשה</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Type */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">סוג הוצאה *</label>
          <select 
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            required
          >
            <option value="" disabled>בחר סוג הוצאה</option>
            {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="other">+ הוסף חדש...</option>
          </select>
          {expenseType === "other" && (
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                value={newExpenseType} 
                onChange={(e) => setNewExpenseType(e.target.value)} 
                placeholder="הקלד סוג חדש" 
                className="flex-grow px-3 py-2 border rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">סכום (₪) *</label>
          <input 
            type="number" 
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            placeholder="0.00"
            required
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">צורת תשלום *</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            required
          >
            <option value="" disabled>בחר צורת תשלום</option>
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            <option value="other">+ הוסף חדש...</option>
          </select>
          {paymentMethod === "other" && (
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                value={newPaymentMethod} 
                onChange={(e) => setNewPaymentMethod(e.target.value)} 
                placeholder="הקלד צורת תשלום" 
                className="flex-grow px-3 py-2 border rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">תאריך קניה *</label>
          <input 
            type="date" 
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">תאריך תשלום בפועל *</label>
          <input 
            type="date" 
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            required
          />
        </div>
      </div>

      {/* Receipt Image Upload */}
      <div className="space-y-2 pt-2 border-t">
        <label className="text-sm font-semibold text-slate-700 block">צילום/העלאת קבלה (אופציונלי)</label>
        <div className="flex flex-wrap gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-xl flex items-center gap-2" 
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" /> צלם קבלה
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-xl flex items-center gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" /> העלה קובץ
          </Button>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={cameraInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>
        
        {isUploading && (
          <div className="flex items-center gap-2 text-secondary text-sm font-medium mt-2">
            <Loader2 className="w-4 h-4 animate-spin" /> מעבד ומעלה תמונה...
          </div>
        )}
        
        {receiptUrl && !isUploading && (
          <div className="mt-4 relative w-32 h-32 border rounded-xl overflow-hidden shadow-sm">
            <img src={receiptUrl} alt="Receipt preview" className="object-cover w-full h-full" />
            <button 
              type="button" 
              onClick={() => setReceiptUrl("")} 
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
            >
              <Plus className="w-3 h-3 rotate-45" />
            </button>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full md:w-auto px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "שמור הוצאה"}
        </Button>
      </div>
    </form>
  );
}
