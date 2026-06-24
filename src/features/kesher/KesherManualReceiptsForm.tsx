"use client";

import { useState, useEffect } from "react";
import { createManualInvoice } from "./actions";
import { getContacts } from "@/features/crm/actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, FileText, Banknote, Landmark, CreditCard as CreditCardIcon, Plus } from "lucide-react";
import { KesherCheckout } from "./KesherCheckout";
import { Contact } from "@/features/crm/types";
import { ContactModal } from "@/app/dashboard/crm/ContactModal";

export function KesherManualReceiptsForm() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  useEffect(() => {
    // Fetch contacts from CRM to populate the datalist
    getContacts({ per_page: 1000 }).then((res) => {
      if (res && res.contacts) {
        setContacts(res.contacts);
      }
    });
  }, []);

  const [formData, setFormData] = useState({
    clientName: "",
    amount: "",
    paymentType: "" as "" | "Cash" | "Check" | "BankTransfer" | "CreditCard",
    receiptType: "000",
    zeout: "",
    phone: "",
    email: "",
    details: "",
    date: new Date().toLocaleDateString("he-IL").replace(/\./g, '/'),
    
    // Extra fields for check / transfer
    checkNumber: "",
    bankName: "",
    branchNumber: "",
    accountNumber: "",
    transferRef: "",
  });

  const [existingContact, setExistingContact] = useState<Contact | null>(null);
  const [isContactChanged, setIsContactChanged] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    if (existingContact) {
      const p = existingContact.payment_details || {};
      const bankChanged = 
        (formData.checkNumber && formData.checkNumber !== p.checkNumber) ||
        (formData.bankName && formData.bankName !== p.bankName) ||
        (formData.branchNumber && formData.branchNumber !== p.branchNumber) ||
        (formData.accountNumber && formData.accountNumber !== p.accountNumber) ||
        (formData.transferRef && formData.transferRef !== p.transferRef);

      const changed = 
        (formData.phone && formData.phone !== existingContact.conta_phone) ||
        (formData.email && formData.email !== existingContact.email) ||
        (formData.zeout && formData.zeout !== existingContact.tg1) ||
        bankChanged;
      setIsContactChanged(!!changed);
    } else {
      setIsContactChanged(false);
    }
  }, [formData, existingContact]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentType) {
      setError("נא לבחור אמצעי תשלום");
      return;
    }
    setLoading(true);
    setSuccess("");
    setError("");

    if (!formData.clientName || !formData.amount) {
      setError("נא למלא שם לקוח וסכום.");
      setLoading(false);
      return;
    }

    try {
      const res = await createManualInvoice({
        ...formData,
        amount: Number(formData.amount),
      });

      if (res.success) {
        console.log("תוצאת השליחה לקשר (Kesher API Result):", res.kesherResult);
        if (res.payloadSent) {
          console.log("%cבקשה שנשלחה לקשר (מוכנה להעתקה):", "color: #0284c7; font-weight: bold; font-size: 14px;");
          console.log(JSON.stringify(res.payloadSent, null, 2));
        }
        setSuccess(res.message || "הקבלה הופקה בהצלחה ונשמרה בקשר!");
        // Reset form
        setFormData({
          clientName: "",
          amount: "",
          paymentType: "",
          receiptType: "000",
          zeout: "",
          phone: "",
          email: "",
          details: "",
          date: new Date().toLocaleDateString("he-IL").replace(/\./g, '/'),
          checkNumber: "",
          bankName: "",
          branchNumber: "",
          accountNumber: "",
          transferRef: "",
        });
        setExistingContact(null);
      } else {
        console.log("%cשגיאה מקשר:", "color: #dc2626; font-weight: bold; font-size: 14px;", res.error);
        if (res.payloadSent) {
          console.log("%cבקשה שנשלחה לקשר (מוכנה להעתקה):", "color: #0284c7; font-weight: bold; font-size: 14px;");
          console.log(JSON.stringify(res.payloadSent, null, 2));
        }
        if (res.rawResponse) {
          console.log("%cתשובה גולמית מקשר:", "color: #dc2626; font-weight: bold; font-size: 14px;");
          console.log(res.rawResponse);
        }
        setError(res.error || "שגיאה לא ידועה בהפקת הקבלה.");
      }
    } catch (err: any) {
      console.error("Exception:", err);
      setError("שגיאת תקשורת: " + err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-2xl shadow-sm p-6 md:p-8 max-w-3xl space-y-8 pb-32 mb-12" dir="rtl">
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        
        {/* Client Name (100% width) - Moved to top */}
        <div className="w-full relative">
          <input
            type="text"
            list="crm-contacts-list"
            value={formData.clientName}
            onChange={(e) => {
              const selectedName = e.target.value;
              const contact = contacts.find(c => c.conta_name === selectedName);
              if (contact) {
                setExistingContact(contact);
                setFormData({
                  ...formData, 
                  clientName: selectedName,
                  phone: contact.conta_phone || formData.phone,
                  email: contact.email || formData.email,
                  zeout: contact.tg1 || formData.zeout,
                  checkNumber: contact.payment_details?.checkNumber || formData.checkNumber,
                  bankName: contact.payment_details?.bankName || formData.bankName,
                  branchNumber: contact.payment_details?.branchNumber || formData.branchNumber,
                  accountNumber: contact.payment_details?.accountNumber || formData.accountNumber,
                  transferRef: contact.payment_details?.transferRef || formData.transferRef,
                });
              } else {
                setExistingContact(null);
                setFormData({ ...formData, clientName: selectedName });
              }
            }}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
            placeholder="שם הלקוח / התורם"
            required
            autoComplete="off"
          />
          <datalist id="crm-contacts-list">
            {contacts.map((c) => (
              <option key={c.id} value={c.conta_name}>
                {c.conta_phone ? `${c.conta_phone}` : ""}
              </option>
            ))}
          </datalist>
          {formData.clientName.trim() !== "" && (
            <div className="mt-2 flex">
              {!existingContact ? (
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-sm font-medium flex items-center gap-1 transition-colors bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-600 w-max shadow-sm"
                >
                  <Plus className="w-4 h-4" /> שמור איש קשר
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-sm font-medium flex items-center gap-1 transition-colors bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-600 w-max shadow-sm"
                >
                  {isContactChanged ? "✎ עדכן איש קשר" : "✅ איש קשר"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payment Type */}
        <div>
          <select
            value={formData.paymentType}
            onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-semibold appearance-none"
            required
          >
            <option value="" disabled>בחר אמצעי תשלום</option>
            <option value="CreditCard">💳 כרטיס אשראי</option>
            <option value="Cash">💵 מזומן</option>
            <option value="Check">📝 צ'ק</option>
            <option value="BankTransfer">🏦 העברה בנקאית</option>
          </select>
        </div>

        {/* Conditional Fields for Check */}
        {formData.paymentType === "Check" && (
          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              פרטי צ'ק
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.checkNumber}
                  onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר צ'ק *"
                  required={formData.paymentType === "Check"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר בנק *"
                  required={formData.paymentType === "Check"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.branchNumber}
                  onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="סניף *"
                  required={formData.paymentType === "Check"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר חשבון *"
                  required={formData.paymentType === "Check"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Fields for Bank Transfer */}
        {formData.paymentType === "BankTransfer" && (
          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-blue-600" />
              פרטי העברה בנקאית
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.transferRef}
                  onChange={(e) => setFormData({ ...formData, transferRef: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר אסמכתא *"
                  required={formData.paymentType === "BankTransfer"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר בנק *"
                  required={formData.paymentType === "BankTransfer"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.branchNumber}
                  onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="סניף מעביר *"
                  required={formData.paymentType === "BankTransfer"}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="מספר חשבון מעביר *"
                  required={formData.paymentType === "BankTransfer"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-lg transition-all"
            placeholder="סכום לתשלום (₪)"
            required
            min="1"
          />
        </div>



        {/* Phone (No label) */}
        <div>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="מספר טלפון"
            dir="rtl"
          />
        </div>

        {/* Email (No label) */}
        <div>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="כתובת אימייל"
            dir="rtl"
          />
        </div>

        {/* Zeout / ID (No label) */}
        <div>
          <input
            type="text"
            value={formData.zeout}
            onChange={(e) => setFormData({ ...formData, zeout: e.target.value })}
            className="w-full h-12 px-4 bg-blue-50/30 border border-blue-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="תעודת זהות / ח.פ"
            dir="rtl"
          />
        </div>

      </div>



      <div className="pt-4 border-t">
        {formData.paymentType === "CreditCard" ? (
          <div className="space-y-4">
            {!formData.clientName || !formData.amount ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200">
                נא להזין שם לקוח וסכום לפני המעבר לסליקה באשראי.
              </div>
            ) : (
              <div className="space-y-4">
                <Button type="button" disabled={loading} className="w-full md:w-auto h-12 px-8 font-bold text-lg mb-4 hidden">
                  {/* Keep the button logic transparent for the CreditCard component that handles its own submit */}
                </Button>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl mb-4 flex items-center justify-between text-indigo-700">
                  <span className="font-bold text-sm">
                    {!existingContact ? "✨ איש קשר חדש יישמר במערכת" : isContactChanged ? "🔄 פרטי איש הקשר יעודכנו" : "✅ איש קשר מזוהה במערכת"}
                  </span>
                </div>
                <KesherCheckout 
                  amount={Number(formData.amount)} 
                  clientName={formData.clientName} 
                  phone={formData.phone} 
                  description={formData.details || `סליקה מלוח הבקרה עבור ${formData.clientName}`} 
                  onSuccess={() => setSuccess("הסליקה בוצעה בהצלחה והפרטים נשמרו!")}
                />
              </div>
            )}
          </div>
        ) : (
          <Button type="submit" disabled={loading} className="w-full h-14 font-bold text-lg shadow-md hover:shadow-lg transition-all rounded-xl relative overflow-hidden group">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? "מפיק מסמך..." : "הפק מסמך"}
            </span>
          </Button>
        )}
      </div>

      {/* Add New Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contact={existingContact ? {
          ...existingContact,
          conta_phone: formData.phone || existingContact.conta_phone,
          email: formData.email || existingContact.email,
          tg1: formData.zeout || existingContact.tg1,
          payment_details: {
            ...(existingContact.payment_details || {}),
            checkNumber: formData.checkNumber || existingContact.payment_details?.checkNumber || "",
            bankName: formData.bankName || existingContact.payment_details?.bankName || "",
            branchNumber: formData.branchNumber || existingContact.payment_details?.branchNumber || "",
            accountNumber: formData.accountNumber || existingContact.payment_details?.accountNumber || "",
            transferRef: formData.transferRef || existingContact.payment_details?.transferRef || "",
          }
        } : {
          id: "",
          ownerId: "",
          conta_name: formData.clientName,
          conta_phone: formData.phone,
          email: formData.email,
          tg1: formData.zeout,
          payment_details: {
            checkNumber: formData.checkNumber,
            bankName: formData.bankName,
            branchNumber: formData.branchNumber,
            accountNumber: formData.accountNumber,
            transferRef: formData.transferRef,
          }
        } as any}
        onSuccess={() => {
          setIsContactModalOpen(false);
          // Re-fetch contacts or optimistic update
          getContacts({ per_page: 1000 }).then((res) => {
            if (res && res.contacts) {
              setContacts(res.contacts);
              const updated = res.contacts.find((c: any) => c.conta_name === formData.clientName);
              if (updated) {
                setExistingContact(updated);
                setFormData(prev => ({
                  ...prev,
                  phone: updated.conta_phone || prev.phone,
                  email: updated.email || prev.email,
                  zeout: updated.tg1 || prev.zeout,
                  checkNumber: updated.payment_details?.checkNumber || prev.checkNumber,
                  bankName: updated.payment_details?.bankName || prev.bankName,
                  branchNumber: updated.payment_details?.branchNumber || prev.branchNumber,
                  accountNumber: updated.payment_details?.accountNumber || prev.accountNumber,
                  transferRef: updated.payment_details?.transferRef || prev.transferRef,
                }));
              } else {
                setExistingContact(null);
              }
            }
          });
        }}
        communities={[]}
      />
    </form>
  );
}
