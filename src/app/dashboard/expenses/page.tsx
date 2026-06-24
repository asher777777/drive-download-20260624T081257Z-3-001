import { getExpenses, getExpenseOptions, createExpense, createExpenseOption } from "@/features/expenses/actions";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { redirect } from "next/navigation";

export const metadata = {
  title: "ניהול הוצאות | Kesher",
  description: "מערכת ניהול וקליטת הוצאות בלוח הבקרה",
};

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  const options = await getExpenseOptions();

  // Combine default options with user options (optional, here we just use whatever is in DB)
  const defaultTypes = ["רכישת ציוד", "שירותים חיצוניים", "שיווק ופרסום", "הוצאות משרד"];
  const defaultMethods = ["כרטיס אשראי", "העברה בנקאית", "מזומן", "צ'ק", "הוראת קבע"];

  const mergedTypes = Array.from(new Set([...defaultTypes, ...options.expenseTypes]));
  const mergedMethods = Array.from(new Set([...defaultMethods, ...options.paymentMethods]));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-primary mb-2">ניהול הוצאות</h1>
        <p className="text-slate-500">קלוט הוצאות חדשות, העלה קבלות, ועקוב אחר ההוצאות שלך במקום אחד.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <ExpenseForm 
            expenseTypes={mergedTypes}
            paymentMethods={mergedMethods}
            onSubmit={createExpense}
            onAddOption={createExpenseOption}
          />
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-primary mb-4">היסטוריית הוצאות</h2>
          <ExpensesList initialExpenses={expenses} />
        </div>
      </div>
    </div>
  );
}
