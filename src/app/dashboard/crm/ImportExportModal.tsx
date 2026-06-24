"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Upload, Download } from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  actionLoading: boolean;
}

export function ImportExportModal({
  isOpen,
  onClose,
  onImport,
  onExport,
  actionLoading
}: ImportExportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content className="max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh]">
        <Modal.Close className="left-4 right-auto top-4 z-10" />
        <Modal.Header 
          title="ייבוא וייצוא אנשי קשר"
          description="ייבא רשימת אנשי קשר מקובץ או ייצא את הרשימה הקיימת"
        />

        <Modal.Body className="p-6 md:p-8 bg-slate-50/30">
          <div dir="rtl" className="w-full space-y-6">
            
            {/* Import Option */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ייבוא מקובץ Excel / CSV</h3>
                <p className="text-slate-500 text-sm mt-1">
                  העלה קובץ עם נתוני אנשי קשר כדי להוסיף אותם למערכת באופן גורף.
                </p>
              </div>
              <label className="flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer h-12 px-6 transition-all gap-2 font-bold w-full max-w-[200px]">
                <Upload className="w-4 h-4" />
                בחר קובץ להעלאה
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => {
                    onImport(e);
                    onClose();
                  }} 
                  className="hidden" 
                  disabled={actionLoading}
                />
              </label>
            </div>

            {/* Export Option */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ייצוא לקובץ Excel</h3>
                <p className="text-slate-500 text-sm mt-1">
                  הורד את כל אנשי הקשר הקיימים למחשב שלך בפורמט Excel.
                </p>
              </div>
              <Button 
                onClick={() => {
                  onExport();
                  onClose();
                }} 
                variant="outline"
                disabled={actionLoading}
                className="rounded-xl border-slate-200 hover:bg-slate-50 shadow-sm font-bold text-slate-700 flex items-center justify-center gap-2 h-12 px-6 w-full max-w-[200px]"
              >
                <Download className="w-4 h-4 text-slate-500" />
                ייצא נתונים
              </Button>
            </div>

          </div>
        </Modal.Body>
        <Modal.Footer className="bg-white">
          <div className="flex justify-end w-full">
            <Button
              onClick={onClose}
              className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-10 px-5"
              type="button"
            >
              סגור
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
