"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiSettings } from "@/features/ai/actions";
import { WbsTask, SmartGoals, ValidatorResult, ProjectData } from "./types";
import { revalidatePath } from "next/cache";

// Helper to get Google Generative AI client
async function getGenAIClient(): Promise<GoogleGenerativeAI> {
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }
  if (!apiKey) {
    throw new Error("מפתח ה-API של Gemini אינו מוגדר. אנא הגדר אותו בהגדרות המערכת.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// 1. Speech-to-Text using Gemini Audio capabilities
export async function speechToText(audioBlobBase64: string, mimeType: string = "audio/webm"): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const genAI = await getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBlobBase64
        }
      },
      "תמלל את ההקלטה הבאה לעברית תקנית. תמלל רק את מה שנאמר בהקלטה עצמה, ללא הקדמות, ללא הסברים, וללא הערות שוליים."
    ]);

    const transcribedText = response.response.text().trim();
    return { success: true, text: transcribedText };
  } catch (error: any) {
    console.error("Error in speechToText:", error);
    return { success: false, error: error.message || "שגיאה בפענוח ההקלטה הקולית" };
  }
}

// 2. Generate SMART Goals from prompt and/or document upload
export async function generateSmartGoals(input: { text?: string; fileBase64?: string; fileType?: string }): Promise<{ success: boolean; data?: SmartGoals; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const genAI = await getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const userPrompt = input.text || "רעיון לפרויקט חדש";

    const prompt = `אתה עוזר בינה מלאכותית מומחה לניהול פרויקטים במגזר השלישי ובארגונים קהילתיים.
תפקידך לנתח את הרעיון הגולמי לפרויקט (ואת המסמך המצורף אם ישנו) ולזקק אותו ליעדים חדים ומדידים במודל SMART מוקפד בעברית תקנית.

מבנה יעדי ה-SMART הנדרש:
- S (Specific / ספציפי): הגדרת תוצר ספציפי ומדויק שהפרויקט יפיק.
- M (Measurable / מדיד): הגדרת מדדי הצלחה כמותיים (KPIs), למשל מספר משתתפים, תקציב או כמות דוכנים.
- A (Achievable / בר-השגה): הסבר מדוע היעד הוא ריאלי ובר-השגה בהתחשב באופי הקהילתי/ארגוני.
- R (Relevant / רלוונטי): חיבור היעד למטרות העל ולחזון של הארגון או הקהילה (למשל, חיזוק קשרים קהילתיים, תמיכה בנזקקים).
- T (Time-bound / תחום בזמן): הגדרת לוח זמנים או דד-ליין קשיח להשלמת הפרויקט.

החזר את התשובה אך ורק במבנה JSON הבא:
{
  "s": "...",
  "m": "...",
  "a": "...",
  "r": "...",
  "t": "..."
}

רעיון המנהל:
"${userPrompt}"`;

    const contents: any[] = [];
    if (input.fileBase64 && input.fileType) {
      contents.push({
        inlineData: {
          mimeType: input.fileType,
          data: input.fileBase64
        }
      });
    }
    contents.push(prompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: contents.map(c => typeof c === 'string' ? { text: c } : c) }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText) as SmartGoals;

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Error in generateSmartGoals:", error);
    return { success: false, error: error.message || "שגיאה ביצירת יעדי SMART" };
  }
}

// 3. Needs Validation, Estimation and Risk Analysis (The Validator)
export async function validateProjectNeeds(input: { title: string; smartGoals: SmartGoals; type: "new" | "recurring" }): Promise<{ success: boolean; data?: ValidatorResult; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const genAI = await getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    // Fetch up to 10 historical projects from Firestore for this user to pass as organizational context
    let historicalProjectsContext = "אין פרויקטים קודמים זמינים בארגון לצורך השוואה.";
    try {
      const projectsSnapshot = await adminDb.collection("projects").where("userId", "==", session.user.id).limit(10).get();
      if (!projectsSnapshot.empty) {
        const projList = projectsSnapshot.docs.map(doc => {
          const d = doc.data();
          return {
            name: d.name,
            budget: d.charter?.lockedBudget || d.metrics?.budget || "לא ידוע",
            durationDays: d.charter?.durationDays || d.metrics?.deadlineDays || "לא ידוע"
          };
        });
        historicalProjectsContext = `פרויקטים קודמים שהושלמו בארגון:\n${JSON.stringify(projList, null, 2)}`;
      }
    } catch (dbErr) {
      console.warn("Could not load historical projects context:", dbErr);
    }

    const prompt = `אתה רכיב ה-Validator (המאמת) במערכת ניהול פרויקטים קהילתיים.
תפקידך לבצע בדיקת היתכנות ותיקוף צרכים (Need Validation) ראשונית עבור פרויקט קהילתי, כדי לוודא שאינו מבזבז משאבים לחינם.
עליך לנתח את שם הפרויקט, מודל ה-SMART, וסוג הפרויקט ("new" - מיזם חדש, "recurring" - פרויקט חוזר).

השתמש בהקשר ההיסטורי של הארגון במידת האפשר, או בידע שוק רחב במגזר השלישי בישראל לצורך אומדן:
${historicalProjectsContext}

עליך להפיק:
1. טווח עלויות משוער בשקלים (מינימום ומקסימום) - למשל פרויקט דומה בארגון או בשוק עלה בין X ל-Y.
2. משך זמן מינימלי להקמה בימים.
3. דגלים אדומים (Risks): אזהרות רגולטוריות או תפעוליות חשובות. אם מדובר בילדים, דוכני מזון, קהל רב, אירועי חוץ וכד', עליך לזהות זאת ולהקפיץ אזהרה (למשל: "אישור משטרה, רישוי עסקים, ביטוח אירועים").
4. תיקוף צרכים (Demand/Need Validation): סיכום קצר המסביר האם וכיצד הערך של הפרויקט יענה על צורך אמיתי של הקהילה ומה מומלץ לוודא.

החזר את התשובה אך ורק במבנה JSON הבא:
{
  "estimatedCostMin": number,
  "estimatedCostMax": number,
  "estimatedDurationDays": number,
  "risks": ["סיכון 1...", "סיכון 2..."],
  "demandValidation": "פסקה המפרטת את תיקוף הצרכים והביקוש..."
}

פרטי הפרויקט:
- שם הפרויקט: "${input.title}"
- סוג הפרויקט: "${input.type === "new" ? "מיזם חדש" : "פרויקט חוזר"}"
- יעדי SMART:
  Specific (ספציפי): "${input.smartGoals.s}"
  Measurable (מדיד): "${input.smartGoals.m}"
  Achievable (בר-השגה): "${input.smartGoals.a}"
  Relevant (רלוונטי): "${input.smartGoals.r}"
  Time-bound (תחום בזמן): "${input.smartGoals.t}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText) as ValidatorResult;

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Error in validateProjectNeeds:", error);
    return { success: false, error: error.message || "שגיאה בתיקוף צרכים והערכת פרויקט" };
  }
}

// 4. Generate WBS Task Tree with RACI templates for each node
export async function generateProjectWbs(input: { title: string; smartGoals: SmartGoals; validator: ValidatorResult }): Promise<{ success: boolean; tasks?: WbsTask[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const genAI = await getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `אתה מנוע ה-WBS ו-RACI של מערכת ניהול פרויקטים קהילתיים.
תפקידך לפרק את הפרויקט המוצע לענפים ותתי משימות היררכיות (Work Breakdown Structure).
כל משימה/ענף בעץ חייב לכלול תבנית RACI מוגדרת המכינה אותו לשיוך משאבים בשלבים הבאים.

הנחיות לבניית ה-WBS:
1. המבנה חייב להיות עץ היררכי (השתמש ב-parentId המקשר משימת בן למשימת אב). צמתים ראשיים יהיו קטגוריות על (למשל: "לוגיסטיקה", "שיווק ופרסום", "כוח אדם ומתנדבים") ויהיה להם parentId = null.&rlm;
2. צמתים משניים יתפצלו מהם (למשל "הדפסת פליירים" ישויך לקטגוריית "שיווק ופרסום").
3. כל משימה (כולל קטגוריות על) צריכה להציג:
   - durationDays: זמן משוער בימים לביצוע המשימה.
   - cost: עלות משוערת ספציפית למשימה זו (שים לב: הסכום של כל המשימות לא יעלה על התקציב המשוער ב-Validator).
   - dependencies: מערך המכיל מזהים (ids) של משימות שחייבות להסתיים לפני שמשימה זו תתחיל.
   - raci: אובייקט עם בעלי תפקידים גנריים/עקרוניים:
     - r (Responsible - המבצע): תפקיד גנרי נדרש (למשל "רכז מתנדבים", "מעצב גרפי", "קופירייטר").
     - a (Accountable - המאשר): ברירת מחדל תהיה "מנהל הפרויקט".
     - c (Consulted - המייעץ): למשל "ספק דפוס", "רכז קהילה", או "ייעוץ משפטי".
     - i (Informed - המעודכן): למשל "ועד מנהל" או "מנהל הארגון".

החזר את התשובה אך ורק במבנה JSON הבא:
{
  "tasks": [
    {
      "id": "מחרוזת מזהה ייחודית, למשל t1, t2, log-1",
      "parentId": "מזהה משימת האב או null לקטגוריות ראשיות",
      "title": "שם המשימה או הקטגוריה בעברית",
      "durationDays": number,
      "cost": number,
      "dependencies": ["מזהה_משימה_קודמת"],
      "raci": {
        "r": "תפקיד ביצוע גנרי נדרש",
        "a": "מנהל הפרויקט",
        "c": "תפקיד התייעצות גנרי",
        "i": "תפקיד יידוע גנרי"
      }
    }
  ]
}

נתוני הפרויקט:
- שם הפרויקט: "${input.title}"
- יעדי SMART:
  Specific: "${input.smartGoals.s}"
  Measurable: "${input.smartGoals.m}"
  Time-bound: "${input.smartGoals.t}"
- הערכת עלויות Validator: מינימום ${input.validator.estimatedCostMin} ש"ח, מקסימום ${input.validator.estimatedCostMax} ש"ח.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText) as { tasks: WbsTask[] };

    return { success: true, tasks: parsedData.tasks };
  } catch (error: any) {
    console.error("Error in generateProjectWbs:", error);
    return { success: false, error: error.message || "שגיאה ביצירת עץ המשימות וה-RACI" };
  }
}

// 5. Update WBS with Chat Message instructions
export async function updateWbsWithChat(tasks: WbsTask[], chatMessage: string, projectCharterBudget: number): Promise<{ success: boolean; tasks?: WbsTask[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const genAI = await getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `אתה מנוע עדכון ה-WBS של מערכת ניהול פרויקטים קהילתיים.
לפניך רשימת המשימות הנוכחית של הפרויקט (במבנה גרף היררכי עם תבניות RACI לכל משימה) ופקודת המשתמש לשינוי.

עליך לעדכן את המשימות בהתאם להוראות המשתמש:
1. הוסף, מחק, או שנה משימות, קטגוריות, תלויות (dependencies), משכי זמן (durationDays), תקציבים (cost) ותפקידי RACI בהתאם להוראה.
2. שמור על המבנה ההיררכי התקין של העץ (parentId).
3. ודא כי כל משימה חדשה או קיימת שומרת על מבנה RACI תקין.
4. החזר את רשימת המשימות המעודכנת המלאה במבנה ה-JSON המקורי.

החזר את התשובה אך ורק במבנה JSON הבא:
{
  "tasks": [
    {
      "id": "string",
      "parentId": "string | null",
      "title": "string",
      "durationDays": number,
      "cost": number,
      "dependencies": ["string"],
      "raci": {
        "r": "string",
        "a": "string",
        "c": "string",
        "i": "string"
      }
    }
  ]
}

תקציב מאושר נעול באמנה: ${projectCharterBudget} ש"ח.
רשימת משימות נוכחית:
${JSON.stringify(tasks, null, 2)}

הוראת המשתמש לשינוי:
"${chatMessage}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText) as { tasks: WbsTask[] };

    return { success: true, tasks: parsedData.tasks };
  } catch (error: any) {
    console.error("Error in updateWbsWithChat:", error);
    return { success: false, error: error.message || "שגיאה בעדכון עץ המשימות מול ה-AI" };
  }
}

// 6. Save Project Data to Firestore
export async function saveProject(project: ProjectData): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "לא מורשה - יש להתחבר למערכת" };

    const projectId = project.id || adminDb.collection("projects").doc().id;

    // Calculate final actual metrics from tasks
    let totalBudget = 0;
    let totalHours = 0;
    let maxDuration = 0;

    project.tasks.forEach(t => {
      totalBudget += t.cost || 0;
      totalHours += (t.durationDays || 0) * 8; // Assuming 8-hour workday
      if (!t.parentId) {
        // Top level category sum
        maxDuration = Math.max(maxDuration, t.durationDays || 0);
      }
    });

    // Save to Firestore with user scope
    const projectRef = adminDb.collection("projects").doc(projectId);
    const savePayload: any = {
      ...project,
      id: projectId,
      userId: session.user.id,
      metrics: {
        budget: totalBudget,
        hours: totalHours,
        deadlineDays: project.charter?.durationDays || maxDuration
      },
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString()
    };

    await projectRef.set(savePayload);
    revalidatePath("/dashboard/generator");
    return { success: true, projectId };
  } catch (error: any) {
    console.error("Error in saveProject:", error);
    return { success: false, error: error.message || "שגיאה בשמירת הפרויקט לשרת" };
  }
}
