import { KesherManualReceiptsForm } from "@/features/kesher/KesherManualReceiptsForm";

export default function ReceiptsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">הפקת מסמך הכנסה</h1>
      </div>
      <KesherManualReceiptsForm />
    </div>
  );
}
