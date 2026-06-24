"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function getKesherSettings() {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { getUserDb } = await import("@/lib/firebase-admin");
    const docRef = getUserDb(userId).collection("settings").doc("kesher");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error getting Kesher settings:", err);
  }
  return null;
}

export async function saveKesherSettings(settings: any) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { getUserDb } = await import("@/lib/firebase-admin");
    const docRef = getUserDb(userId).collection("settings").doc("kesher");
    // Automatically set isActive to true if credentials exist
    const isActive = !!(settings.userName && settings.apiKey);
    await docRef.set({ ...settings, isActive }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving Kesher settings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createManualInvoice(data: any) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const settings = await getKesherSettings();
    if (!settings?.userName || !settings?.apiKey) {
      return { success: false, error: "לא הוגדרו פרטי קשר (שם משתמש וסיסמה) בלוח הבקרה." };
    }

    if (!settings.ezCountToken) {
      return { success: false, error: "לא הוגדר טוקן איזיקאונט בלוח הבקרה. טוקן זה חובה להפקת קבלות ידניות דרך קשר." };
    }

    // SendCashTransaction for Manual Receipts (Cash/Check/BankTransfer)
    const payload = {
      Json: {
        userName: settings.userName,
        password: settings.ezCountToken, // User explicitly requested using EasyCount token here
        func: "SendCashTransaction", 
        format: "json",
        cashTran: {
          ChargeOptionType: data.paymentType, // "Cash", "Check", "BankTransfer"
          Total: Math.round(data.amount * 100), // in agorot
          ProjectNumber: data.receiptType || "405", // Receipt type
          FirstName: data.clientName.split(" ")[0] || "",
          LastName: data.clientName.split(" ").slice(1).join(" ") || "",
          Phone: data.phone || "",
          Tz: data.zeout || "",
          Details: data.details || "",
          // Extra fields for check or bank transfer
          CheckNumber: data.checkNumber || "",
          Bank: data.bankName || "",
          Branch: data.branchNumber || "",
          Account: data.accountNumber || "",
          TransferRef: data.transferRef || ""
        }
      },
      format: "json"
    };

    try {
      const response = await fetch("https://kesherhk.info/ConnectToKesher/ConnectToKesher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = responseText; // In case Kesher returns non-JSON ok message
      }
      
      console.log("Kesher API Payload sent:", JSON.stringify(payload, null, 2));
      console.log("Kesher API Response:", result);

      if (result && (result.Status === false || result.status === "error" || result.error)) {
        throw new Error(`שגיאה מקשר: ${result.Description || result.error || "ללא תיאור"} (קוד: ${result.Code || ""})`);
      }
      
      // Save to CRM contacts
      // First, try to find the contact by zeout, phone, or email
      let existingContactId: string | null = null;
      let existingContactData: any = null;

      try {
        const contactsRef = adminDb.collection("contacts");
        let querySnapshot;

        if (data.phone) {
          querySnapshot = await contactsRef.where("conta_phone", "==", data.phone).limit(1).get();
        } else if (data.email) {
          querySnapshot = await contactsRef.where("email", "==", data.email).limit(1).get();
        } else if (data.zeout) {
          querySnapshot = await contactsRef.where("tg1", "==", data.zeout).limit(1).get(); // Assuming tg1 holds zeout/ID
        }

        if (querySnapshot && !querySnapshot.empty) {
          existingContactId = querySnapshot.docs[0].id;
          existingContactData = querySnapshot.docs[0].data();
        }
      } catch (e) {
        console.error("Error finding existing contact:", e);
      }

      const paymentRecord = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString(),
        amount: data.amount,
        paymentType: data.paymentType,
        receiptType: data.receiptType || "405",
        kesherStatus: typeof result === 'string' ? result : "Success",
        receiptLink: result?.DocUrl || result?.Url || "" // Capture URL if returned by Kesher
      };

      const paymentDetails = {
        checkNumber: data.checkNumber || "",
        bankName: data.bankName || "",
        branchNumber: data.branchNumber || "",
        accountNumber: data.accountNumber || "",
        transferRef: data.transferRef || "",
      };

      if (existingContactId) {
        // Update existing
        const payments = existingContactData.payments || [];
        payments.push(paymentRecord);
        
        await adminDb.collection("contacts").doc(existingContactId).update({
          payments: payments,
          total_spent: (existingContactData.total_spent || 0) + data.amount,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new
        await adminDb.collection("contacts").add({
          ownerId: session.user.id,
          status: "active",
          conta_name: data.clientName,
          conta_phone: data.phone || "",
          email: data.email || "",
          tg1: data.zeout || "",
          payments: [paymentRecord],
          payment_details: paymentDetails,
          total_spent: data.amount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lead_source: "Manual Receipt"
        });
      }

      return { 
        success: true, 
        message: "הקבלה נשמרה ב-CRM ונשלחה לקשר בהצלחה!", 
        kesherResult: result, 
        payloadSent: payload 
      };

    } catch (apiError: any) {
      console.error("Kesher API Error during manual invoice:", apiError);
      
      // Do not save to CRM if Kesher explicitly failed
      return { 
        success: false, 
        error: apiError.message || "שגיאה בשליחה למערכת קשר",
        payloadSent: payload,
        rawResponse: apiError.message
      };
    }

  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    return { success: false, error: error.message };
  }
}

export async function connectEasyCount(ezCountToken: string) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const settings = await getKesherSettings();
    if (!settings?.userName || !settings?.apiKey) {
      return { success: false, error: "לא הוגדרו פרטי קשר (שם משתמש וסיסמה)." };
    }

    // Save the ezCountToken to settings
    await saveKesherSettings({ ...settings, ezCountToken });

    // The Kesher docs specify a GET request. We guess the parameters since they are missing from their table.
    const url = new URL("https://kesherhk.info/KesherAPI/ConnectToEZCountService");
    url.searchParams.append("userName", settings.userName);
    url.searchParams.append("password", settings.apiKey);
    url.searchParams.append("token", ezCountToken); // guessing the param name

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { Message: resultText };
    }

    console.log("Kesher EasyCount Connect Response:", result);

    if (result && result.Succeeded === false) {
      return { success: false, error: result.Message || "שגיאה בחיבור לאיזיקאונט דרך קשר." };
    }

    return { success: true, message: result.Message || "חובר בהצלחה לאיזיקאונט!" };
  } catch (error: any) {
    console.error("Error connecting EasyCount:", error);
    return { success: false, error: error.message };
  }
}
