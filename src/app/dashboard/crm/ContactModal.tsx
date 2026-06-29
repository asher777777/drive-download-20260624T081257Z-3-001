"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Contact, ContactEvent } from "@/features/crm/types";
import { createContact, updateContact, getCustomFields, checkIsSuperAdmin, getContactUserSettings, saveContactUserSettings, getCustomTabs, addCustomTab, addCustomField } from "@/features/crm/actions";
import { syncContactMessages } from "@/features/whatsapp/actions";
import { uploadMediaFile } from "@/features/media/actions";
import { ChevronUp, ChevronDown, Calendar, Tag, Building, Clock, CreditCard, User, Users, Plus, Trash2, MessageCircle, Phone, Mail, Edit, RefreshCw, Settings, Loader2, UploadCloud } from "lucide-react";

const getInitials = (name: string, fm?: string) => {
  const first = name ? name.trim().charAt(0) : "";
  const last = fm ? fm.trim().charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};

const getAvatarBg = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null; // null if creating a new contact
  communities?: any[];
  onSuccess: () => void;
}

type TabType = "details" | "camp" | "tags" | "company" | "events" | "timeline" | "payments" | "userDetails";

export function ContactModal({ isOpen, onClose, contact, onSuccess }: ContactModalProps) {
  const isEdit = !!contact;
  const [activeTab, setActiveTab] = useState<TabType | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleSyncWhatsApp = async () => {
    if (!contact?.id || !contaPhone) return;
    setSyncing(true);
    try {
      const res = await syncContactMessages(contact.id, contaPhone);
      if (res.success) {
        alert(`סנכרון וואטסאפ הושלם! סונכרנו ${res.syncedCount} הודעות חדשות.`);
        onSuccess();
        onClose();
      } else {
        alert("שגיאה בסנכרון הודעות וואטסאפ.");
      }
    } catch (err: any) {
      alert("שגיאה בסנכרון: " + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

  // Form fields state
  const [contaName, setContaName] = useState("");
  const [fM, setFM] = useState("");
  const [contaPhone, setContaPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  
  const [tg1, setTg1] = useState("");
  const [tg2, setTg2] = useState("");
  const [tg3, setTg3] = useState("");
  const [notes, setNotes] = useState("");
  
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [lastFormName, setLastFormName] = useState("");

  const [workPhone, setWorkPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Camp & Family States
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [childIdNumber, setChildIdNumber] = useState("");
  const [allergiesHas, setAllergiesHas] = useState("");
  const [allergiesDetails, setAllergiesDetails] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  // Repeater states
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [eventSubTab, setEventSubTab] = useState<"events" | "timeline">("events");
  const [customFieldsConfig, setCustomFieldsConfig] = useState<any[]>([]);
  const [customFieldsValues, setCustomFieldsValues] = useState<Record<string, any>>({});

  // Custom Tabs State
  const [customTabsConfig, setCustomTabsConfig] = useState<any[]>([]);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newTabTitle, setNewTabTitle] = useState("");
  const [newTabIcon, setNewTabIcon] = useState("Folder");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  // Super Admin / User Details States
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState<any>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsSubTab, setUserDetailsSubTab] = useState<"dashboard" | "settings">("dashboard");
  const [userSaving, setUserSaving] = useState(false);

  useEffect(() => {
    getCustomFields().then(setCustomFieldsConfig);
    checkIsSuperAdmin().then(setIsSuperAdmin).catch(() => setIsSuperAdmin(false));
  }, []);

  const loadCustomTabs = async () => {
    const tabsRes = await getCustomTabs();
    if (Array.isArray(tabsRes)) {
       setCustomTabsConfig(tabsRes);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCustomTabs();
    }
  }, [isOpen]);

  // Initialize fields on open/contact change
  useEffect(() => {
    if (isOpen) {
      setError("");
      setActiveTab("" as any);
      setUserDetailsSubTab("dashboard");
      if (contact) {
        // Fetch User Details if Super Admin
        if (isSuperAdmin && (contact.email || contact.conta_phone)) {
          setUserDetailsLoading(true);
          getContactUserSettings(contact.email || "", contact.conta_phone || "")
            .then(res => {
              if (res.found) {
                setUserDetailsData(res);
              } else {
                setUserDetailsData(null);
              }
            })
            .catch(() => setUserDetailsData(null))
            .finally(() => setUserDetailsLoading(false));
        }
        
        setContaName(contact.conta_name || "");
        setFM(contact.f_m || "");
        setContaPhone(contact.conta_phone || "");
        setEmail(contact.email || "");
        setGender(contact.gender || "");
        setBirthDate(contact.birth_date || "");
        setCity(contact.mh_crm_city || "");
        setStreet(contact.mh_crm_street || "");
        setTg1(contact.tg1 || "");
        setTg2(contact.tg2 || "");
        setTg3(contact.tg3 || "");
        setNotes(contact.notes || "");
        setCompanyName(contact.company_name || "");
        setJobTitle(contact.job_title || "");
        setLeadSource(contact.lead_source || "");
        setLastFormName(contact.last_form_name || "");
        setWorkPhone(contact.work_phone || "");
        setWebsite(contact.website || "");
        
        setChildFirstName(contact.child_first_name || "");
        setChildLastName(contact.child_last_name || "");
        setChildGrade(contact.child_grade || "");
        setChildIdNumber(contact.child_id_number || "");
        setAllergiesHas(contact.allergies_has || "");
        setAllergiesDetails(contact.allergies_details || "");
        setFatherName(contact.father_name || "");
        setMotherName(contact.mother_name || "");
        setFatherPhone(contact.father_phone || "");
        setMotherPhone(contact.mother_phone || "");

        setEvents(contact.events || []);

        const dynamicValues: Record<string, any> = {};
        Object.keys(contact).forEach(k => {
          if (k.startsWith("custom_")) dynamicValues[k] = contact[k];
        });
        setCustomFieldsValues(dynamicValues);
      } else {
        
        // Reset fields for new contact
        setContaName("");
        setFM("");
        setContaPhone("");
        setEmail("");
        setGender("");
        setBirthDate("");
        setCity("");
        setStreet("");
        setTg1("");
        setTg2("");
        setTg3("");
        setNotes("");
        setCompanyName("");
        setJobTitle("");
        setLeadSource("");
        setLastFormName("");
        setWorkPhone("");
        setWebsite("");

        setChildFirstName("");
        setChildLastName("");
        setChildGrade("");
        setChildIdNumber("");
        setAllergiesHas("");
        setAllergiesDetails("");
        setFatherName("");
        setMotherName("");
        setFatherPhone("");
        setMotherPhone("");

        setEvents([]);
        setCustomFieldsValues({});
      }
    }
  }, [isOpen, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contaName || !contaPhone) {
      setError("שם פרטי וטלפון הם שדות חובה");
      return;
    }

    setLoading(true);
    setError("");

    const data: Partial<Contact> = {
      conta_name: contaName,
      f_m: fM,
      conta_phone: contaPhone,
      email,
      gender,
      birth_date: birthDate,
      mh_crm_city: city,
      mh_crm_street: street,
      tg1,
      tg2,
      tg3,
      notes,
      company_name: companyName,
      job_title: jobTitle,
      lead_source: leadSource,
      last_form_name: lastFormName,
      work_phone: workPhone,
      website: website,
      child_first_name: childFirstName,
      child_last_name: childLastName,
      child_grade: childGrade,
      child_id_number: childIdNumber,
      allergies_has: allergiesHas,
      allergies_details: allergiesDetails,
      father_name: fatherName,
      mother_name: motherName,
      father_phone: fatherPhone,
      mother_phone: motherPhone,
      events,
      ...customFieldsValues,
    };

    try {
      if (isEdit && contact?.id) {
        await updateContact(contact.id, data);
      } else {
        await createContact(data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "שגיאה בשמירת איש הקשר");
    } finally {
      setLoading(false);
    }
  };

  // Event handlers for Events Repeater
  const handleAddEvent = () => {
    const newEvent: ContactEvent = {
      time: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
      title: "",
      text: "",
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleUpdateEvent = (index: number, field: keyof ContactEvent, value: string) => {
    const updatedEvents = [...events];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setEvents(updatedEvents);
  };

  const renderCustomFields = (category: string) => {
    const fields = customFieldsConfig.filter(f => f.category === category);
    if (fields.length === 0) return null;

  
  return (
      <div className="mt-6 pt-6 border-t border-slate-100 col-span-full">
        <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">שדות מותאמים אישית</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={customFieldsValues[field.id] || ""}
                  onChange={(e) => setCustomFieldsValues(prev => ({...prev, [field.id]: e.target.value}))}
                  rows={3}
                  className="flex w-full rounded-2xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none"
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={customFieldsValues[field.id] || ""}
                  onChange={(e) => setCustomFieldsValues(prev => ({...prev, [field.id]: e.target.value}))}
                  className="rounded-xl bg-white"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleTabClick = (tabName: TabType | string) => {
    if (activeTab === tabName) {
      setActiveTab("" as any);
    } else {
      setActiveTab(tabName as any);
      setTimeout(() => {
        const el = document.getElementById(`tab-${tabName}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content className="w-11/12 max-w-[450px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-6 sm:p-8 bg-[#0a0a0a] border border-white/10 [&::-webkit-scrollbar]:hidden">
        <div dir="rtl" className="w-full">
          <Modal.Close className="left-4 right-auto" />
          {isEdit ? (
            <div className="flex flex-col items-center text-center space-y-4 border-b pb-6 mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ring-white" style={{ backgroundColor: getAvatarBg(contaName) }}>
                {getInitials(contaName, fM)}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">{contaName} {fM}</h3>
              </div>
              <div className="flex gap-3 w-full max-w-sm">
                {contaPhone && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => window.open(`https://wa.me/${contaPhone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      וואטסאפ
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => window.location.href = `tel:${contaPhone}`}
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      התקשר
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center mb-8 mt-4">
              <h2 className="text-2xl font-black text-white mb-2">הוספת איש קשר חדש</h2>
              <p className="text-sm text-gray-400 font-medium">מלא את שדות החובה להוספת איש קשר חדש למערכת</p>
            </div>
          )}

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Content: Details */}
          <div className="w-full flex flex-col mb-3">
            <button
              type="button"
              id="tab-details"
              onClick={() => handleTabClick("details")}
              className={`w-full h-[68px] px-4 hover:bg-[#1a1a1a] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-all rounded-2xl border border-white/5 bg-[#141414] ${activeTab === "details" ? "ring-1 ring-indigo-500/50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <span>פרטים כלליים</span>
              </div>
              {activeTab === "details" ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {activeTab === "details" && (
              <div className="p-6 bg-[#111] animate-in fade-in duration-200">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">מידע בסיסי</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם פרטי *</label>
                    <Input
                      value={contaName}
                      onChange={(e) => setContaName(e.target.value)}
                      required
                      placeholder="הקלד שם פרטי..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם משפחה</label>
                    <Input
                      value={fM}
                      onChange={(e) => setFM(e.target.value)}
                      placeholder="הקלד שם משפחה..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">מגדר</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">בחר מגדר...</option>
                      <option value="זכר">זכר</option>
                      <option value="נקבה">נקבה</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תאריך לידה</label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">פרטי יצירת קשר וכתובת</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון נייד *</label>
                    <Input
                      value={contaPhone}
                      onChange={(e) => setContaPhone(e.target.value)}
                      required
                      placeholder="05x-xxxxxxx"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">דואר אלקטרוני</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">עיר</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="אזור מגורים..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">רחוב</label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="רחוב ומספר..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              {renderCustomFields("details")}
            </div>
              </div>
          )}
          </div>

          {isSuperAdmin && isEdit && (
            <div className="w-full flex flex-col bg-[#181818] rounded-xl overflow-hidden border border-white/5 shadow-xl mb-4">
              <button
                type="button"
                id="tab-userDetails"
                onClick={() => handleTabClick("userDetails")}
                className={`w-full p-4 hover:bg-[#202020] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-colors sticky top-0 z-20 bg-[#181818] ${activeTab === "userDetails" ? "ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] z-10 relative" : "border-b border-white/5"}`}
              >
                <span className="flex items-center gap-3 text-white">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  פרטי משתמש (הגדרות)
                </span>
                {activeTab === "userDetails" ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>
              {activeTab === "userDetails" && (
                <div className="p-6 bg-[#111] animate-in fade-in duration-200">
                  <div className="space-y-6 animate-in fade-in">
                    {userDetailsLoading ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                    ) : !userDetailsData ? (
                      <div className="text-center text-slate-400 p-8">לא נמצא משתמש רשום עם מספר הטלפון או האימייל של איש קשר זה.</div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex gap-4 border-b border-white/10 pb-2">
                          <button
                            type="button"
                            onClick={() => setUserDetailsSubTab("dashboard")}
                            className={`text-sm font-bold pb-2 border-b-2 ${userDetailsSubTab === "dashboard" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400"}`}
                          >
                            מלוח ראשי
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserDetailsSubTab("settings")}
                            className={`text-sm font-bold pb-2 border-b-2 ${userDetailsSubTab === "settings" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400"}`}
                          >
                            מלוח הגדרות (מפתחות)
                          </button>
                        </div>

                        {userDetailsSubTab === "dashboard" && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">נתוני משתמש</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-white">
                              <div className="bg-[#181818] p-3 rounded-xl border border-white/5">
                                <div className="text-slate-400 text-xs mb-1">מזהה משתמש</div>
                                <div className="font-mono text-xs">{userDetailsData.userId}</div>
                              </div>
                              <div className="bg-[#181818] p-3 rounded-xl border border-white/5">
                                <div className="text-slate-400 text-xs mb-1">סוג הרשאה</div>
                                <div className="font-bold">{userDetailsData.userData.role}</div>
                              </div>
                              <div className="bg-[#181818] p-3 rounded-xl border border-white/5">
                                <div className="text-slate-400 text-xs mb-1">תאריך הרשמה</div>
                                <div>{new Date(userDetailsData.userData.createdAt).toLocaleDateString("he-IL")}</div>
                              </div>
                              {userDetailsData.userData.role === "TRIAL" && (
                                <div className="bg-[#181818] p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
                                  <div className="text-emerald-500/70 text-xs mb-1">תפוגת ניסיון</div>
                                  <div className="font-bold">{userDetailsData.userData.trialExpiresAt ? new Date(userDetailsData.userData.trialExpiresAt).toLocaleDateString("he-IL") : "-"}</div>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-white mt-4">
                              <div className="bg-[#181818] p-3 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                <label className="text-xs font-bold text-slate-400 block mb-1">שם משתמש (התחברות)</label>
                                <Input
                                  value={userDetailsData.userData.username || ""}
                                  onChange={(e) => setUserDetailsData({...userDetailsData, userData: {...userDetailsData.userData, username: e.target.value}})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                                  dir="ltr"
                                />
                              </div>
                              <div className="bg-[#181818] p-3 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                <label className="text-xs font-bold text-slate-400 block mb-1">סיסמה</label>
                                <Input
                                  value={userDetailsData.userData.password || ""}
                                  onChange={(e) => setUserDetailsData({...userDetailsData, userData: {...userDetailsData.userData, password: e.target.value}})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {userDetailsSubTab === "settings" && (
                          <div className="space-y-6">
                            {/* Google AI */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-bold text-emerald-500">Google AI (Gemini)</h5>
                              <Input
                                value={userDetailsData.settings.ai?.googleAiKey || ""}
                                onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, ai: {...userDetailsData.settings.ai, googleAiKey: e.target.value}}})}
                                placeholder="מפתח API..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                                dir="ltr"
                              />
                            </div>
                            
                            {/* WhatsApp */}
                            <div className="space-y-2 border-t border-white/5 pt-4">
                              <h5 className="text-xs font-bold text-emerald-500">WhatsApp (Green API)</h5>
                              <div className="flex gap-2">
                                <Input
                                  value={userDetailsData.settings.whatsapp?.idInstance || ""}
                                  onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, whatsapp: {...userDetailsData.settings.whatsapp, idInstance: e.target.value}}})}
                                  placeholder="ID Instance"
                                  className="w-1/3 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                                  dir="ltr"
                                />
                                <Input
                                  value={userDetailsData.settings.whatsapp?.apiToken || ""}
                                  onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, whatsapp: {...userDetailsData.settings.whatsapp, apiToken: e.target.value}}})}
                                  placeholder="API Token"
                                  className="w-2/3 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                                  dir="ltr"
                                />
                              </div>
                            </div>

                            {/* Kesher / EasyCount */}
                            <div className="space-y-2 border-t border-white/5 pt-4">
                              <h5 className="text-xs font-bold text-emerald-500">קשר ואיזיקאונט (סליקה וחשבוניות)</h5>
                              <Input
                                value={userDetailsData.settings.kesher?.userName || ""}
                                onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, kesher: {...userDetailsData.settings.kesher, userName: e.target.value}}})}
                                placeholder="Kesher Username"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white mb-2"
                                dir="ltr"
                              />
                              <Input
                                value={userDetailsData.settings.kesher?.apiKey || ""}
                                onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, kesher: {...userDetailsData.settings.kesher, apiKey: e.target.value}}})}
                                placeholder="Kesher API Key / Password"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white mb-2"
                                dir="ltr"
                              />
                              <Input
                                value={userDetailsData.settings.kesher?.paymentPageId || ""}
                                onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, kesher: {...userDetailsData.settings.kesher, paymentPageId: e.target.value}}})}
                                placeholder="Kesher Payment Page ID"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white mb-2"
                                dir="ltr"
                              />
                              <Input
                                value={userDetailsData.settings.kesher?.ezCountToken || ""}
                                onChange={(e) => setUserDetailsData({...userDetailsData, settings: {...userDetailsData.settings, kesher: {...userDetailsData.settings.kesher, ezCountToken: e.target.value}}})}
                                placeholder="EasyCount Token"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          disabled={userSaving}
                          onClick={async () => {
                            setUserSaving(true);
                            const res = await saveContactUserSettings(userDetailsData.userId, userDetailsData.settings, userDetailsData.userData);
                            setUserSaving(false);
                            if (res.success) alert("פרטי המשתמש והגדרותיו נשמרו בהצלחה!");
                            else alert("שגיאה: " + res.error);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl mt-4"
                        >
                          {userSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שמור הגדרות ופרטי משתמש"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Tags & Notes */}
          <div className="w-full flex flex-col mb-3">
            <button
              type="button"
              id="tab-tags"
              onClick={() => handleTabClick("tags")}
              className={`w-full h-[68px] px-4 hover:bg-[#1a1a1a] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-all rounded-2xl border border-white/5 bg-[#141414] ${activeTab === "tags" ? "ring-1 ring-indigo-500/50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-gray-400" />
                </div>
                <span>תיוגים והערות</span>
              </div>
              {activeTab === "tags" ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {activeTab === "tags" && (
              <div className="p-6 bg-[#111] animate-in fade-in duration-200">
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">תוויות ותיוג</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 1</label>
                    <Input
                      value={tg1}
                      onChange={(e) => setTg1(e.target.value)}
                      placeholder="הקלד תגית 1..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 2</label>
                    <Input
                      value={tg2}
                      onChange={(e) => setTg2(e.target.value)}
                      placeholder="הקלד תגית 2..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 3</label>
                    <Input
                      value={tg3}
                      onChange={(e) => setTg3(e.target.value)}
                      placeholder="הקלד תגית 3..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">הערות כלליות</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="רשום הערות, תזכורות או מידע חשוב על איש הקשר..."
                  className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              {renderCustomFields("tags")}
            </div>
              </div>
          )}
          </div>

          {/* Tab Content: Company & Lead Source */}
          <div className="w-full flex flex-col mb-3">
            <button
              type="button"
              id="tab-company"
              onClick={() => handleTabClick("company")}
              className={`w-full h-[68px] px-4 hover:bg-[#1a1a1a] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-all rounded-2xl border border-white/5 bg-[#141414] ${activeTab === "company" ? "ring-1 ring-indigo-500/50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Building className="w-4 h-4 text-gray-400" />
                </div>
                <span>חברה ומקור</span>
              </div>
              {activeTab === "company" ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {activeTab === "company" && (
              <div className="p-6 bg-[#111] animate-in fade-in duration-200">
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">תעסוקה וארגון</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם החברה</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="שם מקום העבודה..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תפקיד</label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="הגדרת התפקיד..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון עבודה</label>
                    <Input
                      value={workPhone}
                      onChange={(e) => setWorkPhone(e.target.value)}
                      placeholder="טלפון משרדי..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">אתר אינטרנט</label>
                    <Input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">מקור לידים ומעקב</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">מקור הליד</label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">בחר מקור...</option>
                      <option value="טופס מהאתר">טופס מהאתר</option>
                      <option value="פייסבוק">פייסבוק</option>
                      <option value="גוגל">גוגל</option>
                      <option value="המלצה">המלצה</option>
                      <option value="כנס">כנס</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טופס אחרון שהוגש</label>
                    <Input
                      value={lastFormName}
                      onChange={(e) => setLastFormName(e.target.value)}
                      placeholder="שם הטופס..."
                      className="rounded-xl"
                      disabled
                    />
                  </div>
                </div>
              </div>
              {renderCustomFields("company")}
            </div>
              </div>
          )}
          </div>

          {/* Tab Content: Events Repeater */}
          <div className="w-full flex flex-col bg-[#181818] rounded-xl overflow-hidden border border-white/5 shadow-xl mb-4">
            <button
              type="button"
              id="tab-events"
              onClick={() => handleTabClick("events")}
              className={`w-full p-4 hover:bg-[#202020] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-colors sticky top-0 z-20 bg-[#181818] ${activeTab === "events" ? "ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10 relative" : "border-b border-white/5"}`}
            >
              <span className="flex items-center gap-3 text-white">
                <Calendar className="w-4 h-4" />
                אירועים ומפגשים
              </span>
              {activeTab === "events" ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            {activeTab === "events" && isEdit && (
              <div className="p-6 bg-[#111] animate-in fade-in duration-200">
            <div className="space-y-4 animate-in fade-in">
                {/* Sub-Tabs Navigation */}
                <div className="flex border-b border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => setEventSubTab("events")}
                    className={`px-6 py-3 font-bold text-sm transition-colors ${
                      eventSubTab === "events"
                        ? "border-b-2 border-indigo-500 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    רשימת אירועים
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventSubTab("timeline")}
                    className={`px-6 py-3 font-bold text-sm transition-colors ${
                      eventSubTab === "timeline"
                        ? "border-b-2 border-indigo-500 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ציר זמן
                  </button>
                </div>
                
                {eventSubTab === "events" && (
                  <div className="animate-in fade-in space-y-4">
                    <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">היסטוריית אירועים ומפגשים</h4>
                <Button
                  type="button"
                  onClick={handleAddEvent}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף אירוע
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-2xl text-slate-400 text-sm">
                  לא תועדו אירועים או מפגשים מול איש קשר זה. לחץ על "הוסף אירוע" כדי לתעד מפגש/שיחה.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {events.map((event, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(index)}
                        className="absolute left-4 top-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="מחק אירוע"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">תאריך ושעה</label>
                          <Input
                            type="datetime-local"
                            value={event.time}
                            onChange={(e) => handleUpdateEvent(index, "time", e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">כותרת המפגש</label>
                          <Input
                            value={event.title}
                            onChange={(e) => handleUpdateEvent(index, "title", e.target.value)}
                            placeholder="לדוגמה: שיחת טלפון, פגישת ייעוץ..."
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">סיכום המפגש / הערות</label>
                        <textarea
                          value={event.text}
                          onChange={(e) => handleUpdateEvent(index, "text", e.target.value)}
                          rows={2}
                          placeholder="תקצר את מהלך המפגש או השיחה..."
                          className="w-full text-xs p-2 border rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {renderCustomFields("events")}
                  </div>
                )}
                
                {eventSubTab === "timeline" && (
                  <div className="animate-in fade-in space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2">ציר זמן אינטראקציות ופעולות</h4>
              
              <div className="relative border-r-2 border-slate-100 mr-3 pr-6 space-y-6 max-h-[350px] overflow-y-auto pl-1">
                {/* Contact Creation Event */}
                <div className="relative">
                  <span className="absolute -right-[31px] top-1 bg-green-500 text-white rounded-full p-1 ring-4 ring-white">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {contact?.createdAt ? new Date(contact.createdAt).toLocaleString("he-IL") : ""}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">הקמת איש קשר</h5>
                    <p className="text-xs text-slate-500">איש הקשר נוצר במערכת.</p>
                  </div>
                </div>

                {/* Form Submissions Timeline */}
                {contact?.form_submissions && contact.form_submissions.length > 0 ? (
                  contact.form_submissions.map((fs, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -right-[31px] top-1 bg-indigo-500 text-white rounded-full p-1 ring-4 ring-white">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {fs.date ? new Date(fs.date).toLocaleString("he-IL") : ""}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800">הגשת טופס: {fs.name}</h5>
                        <p className="text-xs text-slate-500">עמוד: {fs.page}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <span className="absolute -right-[31px] top-1 bg-slate-200 text-slate-500 rounded-full p-1 ring-4 ring-white">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400">אין פניות או הגשות טפסים</h5>
                      <p className="text-xs text-slate-400">לא נרשמו הגשות טפסים אוטומטיות מהאתר.</p>
                    </div>
                  </div>
                )}
              </div>
                  </div>
                )}
\n</div>
              </div>
          )}
          </div>

          {/* Tab Content: Payments */}
          <div className="w-full flex flex-col bg-[#181818] rounded-xl overflow-hidden border border-white/5 shadow-xl mb-4">
            <button
              type="button"
              id="tab-payments"
              onClick={() => handleTabClick("payments")}
              className={`w-full p-4 hover:bg-[#202020] flex items-center justify-between font-bold text-white text-sm cursor-pointer transition-colors sticky top-0 z-20 bg-[#181818] ${activeTab === "payments" ? "ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10 relative" : "border-b border-white/5"}`}
            >
              <span className="flex items-center gap-3 text-white">
                <CreditCard className="w-4 h-4" />
                תשלומים
              </span>
              {activeTab === "payments" ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            {activeTab === "payments" && isEdit && (
              <div className="p-6 bg-[#111] animate-in fade-in duration-200">
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">סיכום רכישות והיסטוריית הזמנות</h4>

              {/* Stats Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-emerald-600">סה"כ תרומות ותשלומים</span>
                  <span className="text-xl font-black text-emerald-800 mt-1">₪{(contact?.total_spent || 0).toFixed(2)}</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-indigo-600">מספר עסקאות</span>
                  <span className="text-xl font-black text-indigo-800 mt-1">{contact?.order_count || 0}</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-amber-600">עסקה אחרונה</span>
                  <span className="text-xs font-black text-amber-800 mt-2 truncate">
                    {contact?.last_order_date ? new Date(contact.last_order_date).toLocaleDateString("he-IL") : "אין עדיין"}
                  </span>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700">פירוט עסקאות אחרונות</h5>
                {(contact?.order_count || 0) === 0 ? (
                  <div className="p-6 text-center border rounded-2xl text-slate-400 text-xs bg-slate-50/50">
                    לא נמצאה היסטוריית תשלומים עבור איש קשר זה.
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden bg-white shadow-sm max-h-[200px] overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b font-bold text-slate-600">
                        <tr>
                          <th className="p-3">סכום</th>
                          <th className="p-3">תאריך</th>
                          <th className="p-3">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {/* Simulating orders based on summary fields */}
                        {contact?.last_order_date && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">₪{(contact.total_spent || 0).toFixed(2)}</td>
                            <td className="p-3">{new Date(contact.last_order_date).toLocaleDateString("he-IL")}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-bold">
                                הושלם
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
              </div>
          )}
          </div>

          {/* Custom Tabs */}
          {customTabsConfig.map(tab => {
             let IconCmp = Plus;
             if (tab.icon === "Star") IconCmp = require("lucide-react").Star;
             else if (tab.icon === "Heart") IconCmp = require("lucide-react").Heart;
             else if (tab.icon === "Briefcase") IconCmp = require("lucide-react").Briefcase;
             else if (tab.icon === "Zap") IconCmp = require("lucide-react").Zap;
             else if (tab.icon === "Globe") IconCmp = require("lucide-react").Globe;
             else IconCmp = require("lucide-react").Folder;

             return (
              <div key={tab.id} className="w-full flex flex-col mb-3">
                <button
                  type="button"
                  id={`tab-${tab.id}`}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`w-full h-[68px] px-4 hover:bg-[#1a1a1a] flex items-center justify-between font-bold text-emerald-400 text-sm cursor-pointer transition-all rounded-2xl border border-white/5 bg-[#141414] ${activeTab === tab.id ? "ring-1 ring-emerald-500/50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <IconCmp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span>{tab.title}</span>
                  </div>
                  {activeTab === tab.id ? <ChevronUp className="h-5 w-5 text-emerald-500" /> : <ChevronDown className="h-5 w-5 text-emerald-500" />}
                </button>
                {activeTab === tab.id && (
                  <div className="p-6 bg-[#111] animate-in fade-in duration-200">
                    <div className="flex justify-end mb-4">
                      <Button type="button" onClick={() => setShowAddFieldModal(true)} className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs py-1.5 px-3 flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> הוסף שדה ללשונית זו
                      </Button>
                    </div>
                    {customFieldsConfig.filter(f => f.category === tab.id).length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-sm">
                        אין עדיין שדות בלשונית זו.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customFieldsConfig.filter(f => f.category === tab.id).map((f: any) => (
                          <div key={f.id} className={`space-y-1.5 ${f.type === 'documents' ? 'col-span-1 md:col-span-2' : ''}`}>
                            <label className="text-xs font-bold text-slate-600">{f.label}</label>
                            
                            {f.type === 'documents' ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {(customFieldsValues[f.id] || []).map((doc: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-xs">
                                      <a href={typeof doc === 'string' ? doc : doc.url} target="_blank" className="hover:underline max-w-[200px] truncate font-semibold">
                                        {typeof doc === 'string' ? 'מסמך ' + (i+1) : doc.name}
                                      </a>
                                      <button type="button" onClick={() => {
                                        const newDocs = [...(customFieldsValues[f.id] || [])];
                                        newDocs.splice(i, 1);
                                        setCustomFieldsValues({ ...customFieldsValues, [f.id]: newDocs });
                                      }} className="text-indigo-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 relative">
                                  <Input
                                    type="file"
                                    multiple
                                    disabled={uploadingFieldId === f.id}
                                    onChange={async (e) => {
                                      const files = e.target.files;
                                      if (!files || files.length === 0) return;
                                      setUploadingFieldId(f.id);
                                      const newDocs = [...(customFieldsValues[f.id] || [])];
                                      for (let i = 0; i < files.length; i++) {
                                        const file = files[i];
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        try {
                                          const res = await uploadMediaFile(formData);
                                          if (res.success && res.url) {
                                            newDocs.push({ name: file.name, url: res.url });
                                          }
                                        } catch (err) {
                                          console.error("Upload failed", err);
                                        }
                                      }
                                      setCustomFieldsValues({ ...customFieldsValues, [f.id]: newDocs });
                                      setUploadingFieldId(null);
                                      e.target.value = "";
                                    }}
                                    className="bg-white border border-slate-200 rounded-xl text-xs py-2 h-auto"
                                  />
                                  {uploadingFieldId === f.id && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded-md">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> מעלה...
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Input
                                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                value={customFieldsValues[f.id] || ""}
                                onChange={(e) => setCustomFieldsValues({ ...customFieldsValues, [f.id]: e.target.value })}
                                placeholder={f.label}
                                className="bg-white border border-slate-200 rounded-xl"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
             )
          })}

          <div className="flex justify-center mb-6 mt-4">
             <button type="button" onClick={() => setShowAddTabModal(true)} className="flex items-center gap-2 px-6 py-3 border border-dashed border-white/10 rounded-2xl text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-bold text-sm w-full justify-center">
               <Plus className="w-4 h-4" /> הוסף לשונית מותאמת אישית
             </button>
          </div>

          {/* Footer buttons */}
          <Modal.Footer className="bg-transparent border-t-0 p-0 mt-8">
            <div className="flex w-full justify-start rtl:justify-end">
              <Button
                type="submit"
                variant="primary"
                className="rounded-2xl font-black bg-[#5B45F8] hover:bg-[#4a36d6] text-white h-[56px] px-8 min-w-[160px] shadow-lg shadow-indigo-500/20"
                disabled={loading}
              >
                {loading ? "שומר..." : (isEdit ? "שמור שינויים" : "צור איש קשר")}
              </Button>
            </div>
          </Modal.Footer>
        </form>
        </div>
      </Modal.Content>
      <AddTabModal 
        isOpen={showAddTabModal} 
        onClose={() => setShowAddTabModal(false)} 
        isAdding={isAddingTab}
        onSave={async (data: any) => {
          setIsAddingTab(true);
          const res = await addCustomTab({ title: data.title, icon: data.icon });
          if (res.success && res.tab) {
            setCustomTabsConfig([...customTabsConfig, { id: res.tab.id, title: data.title, icon: data.icon }]);
            setShowAddTabModal(false);
          }
          setIsAddingTab(false);
        }}
      />
      <AddFieldModal
        isOpen={showAddFieldModal}
        onClose={() => setShowAddFieldModal(false)}
        isAdding={isAddingField}
        onSave={async (data: any) => {
          if (!activeTab) return;
          setIsAddingField(true);
          const res = await addCustomField({ category: activeTab as string, label: data.label, type: data.type });
          if (res.success && res.field) {
            const newField = { id: res.field.id, category: activeTab as string, label: data.label, type: data.type };
            setCustomFieldsConfig([...customFieldsConfig, newField]);
            setShowAddFieldModal(false);
          }
          setIsAddingField(false);
        }}
      />
    </Modal>
  );
}

function AddTabModal({ isOpen, onClose, onSave, isAdding }: any) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("Folder");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 space-y-6 shadow-2xl">
        <h3 className="text-xl font-black text-white text-right">הוספת לשונית חדשה</h3>
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-slate-400">כותרת הלשונית</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: פרטי רכב" />
        </div>
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-slate-400">אייקון</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
            <option value="Folder">תיקייה</option>
            <option value="Star">כוכב</option>
            <option value="Heart">לב</option>
            <option value="Briefcase">תיק עבודות</option>
            <option value="Zap">ברק</option>
            <option value="Globe">כדור הארץ</option>
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={onClose} className="flex-1 bg-white/10 text-white rounded-xl">ביטול</Button>
          <Button type="button" onClick={() => onSave({ title, icon })} disabled={isAdding || !title} className="flex-1 bg-emerald-600 text-white rounded-xl">שמור</Button>
        </div>
      </div>
    </div>
  )
}

function AddFieldModal({ isOpen, onClose, onSave, isAdding }: any) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 space-y-6 shadow-2xl">
        <h3 className="text-xl font-black text-white text-right">הוספת שדה ללשונית</h3>
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-slate-400">שם השדה</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="לדוגמה: סוג רכב" />
        </div>
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-bold text-slate-400">סוג נתונים</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
            <option value="text">טקסט (Text)</option>
            <option value="number">מספר (Number)</option>
            <option value="date">תאריך (Date)</option>
            <option value="documents">מסמכים (קובץ/תמונה מרובים)</option>
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={onClose} className="flex-1 bg-white/10 text-white rounded-xl">ביטול</Button>
          <Button type="button" onClick={() => onSave({ label, type })} disabled={isAdding || !label} className="flex-1 bg-emerald-600 text-white rounded-xl">שמור</Button>
        </div>
      </div>
    </div>
  )
}
