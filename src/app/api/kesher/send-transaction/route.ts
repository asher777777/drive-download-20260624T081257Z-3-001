import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || "12345678901234567890123456789012"; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      creditNumber, 
      expiry, 
      cvv2, 
      clientName, 
      phone, 
      email, 
      transactionId, 
      installments,
      paymentFrequency, // "one-time" | "recurring" | "user-choice"
      userId: requestUserId 
    } = body;

    const session = await auth();
    const userId = requestUserId || session?.user?.id;

    let settings: any = null;

    if (userId) {
      // Get user settings
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (userData?.useAdminKesher) {
          const globalDoc = await adminDb.collection("configs").doc("global").get();
          const globalConfig = globalDoc.data() || {};
          settings = {
            userName: globalConfig.kesherUserName || "",
            apiKey: globalConfig.kesherApiKey || "",
            paymentPageId: globalConfig.kesherPaymentPageId || "",
            ezCountToken: globalConfig.kesherEzCountToken || ""
          };
        } else if (userData?.kesherSettings?.userName || userData?.kesherSettings?.apiKey) {
          settings = userData.kesherSettings;
        } else if (userData?.settings?.kesher) {
          settings = userData.settings.kesher;
        }
      }
    }

    if (!settings || (!settings.userName && !settings.apiKey)) {
      const globalDoc = await adminDb.collection("configs").doc("global").get();
      const globalConfig = globalDoc.exists ? globalDoc.data() : null;

      settings = {
        userName: globalConfig?.kesherUserName || "",
        apiKey: globalConfig?.kesherApiKey || "",
        paymentPageId: globalConfig?.kesherPaymentPageId || "",
        ezCountToken: globalConfig?.kesherEzCountToken || ""
      };
    }

    if (!settings || !settings.userName || !settings.apiKey) {
      return NextResponse.json({ success: false, error: "כרגע לא ניתן להשתמש בשירות התשלומים. אנא פנה להנהלה." }, { status: 400 });
    }

    let numPayments = 1;
    let creditType = 1;

    if (paymentFrequency === "recurring" || installments === 9999) {
      // If the user specified a specific number of months (e.g. 12), use it. Otherwise, unlimited (9999).
      numPayments = (installments && installments > 0) ? installments : 9999;
      creditType = 1; // 1 usually works for standing order profile (monthly billing without holding credit frame)
    } else if (installments && installments > 1) {
      numPayments = installments;
      creditType = 8; // Sometimes 4 or 8 in Israel for installments (holds credit frame)
    }

    const payload = {
      Json: {
        userName: settings.userName,
        password: settings.apiKey, 
        func: "SendTransaction",
        format: "json",
        tran: {
          Address: "",
          ApiKey: "XXX", // As in keser.html
          City: "",
          CreditNum: creditNumber,
          Token: null,
          Expiry: expiry, // YYMM
          Cvv2: cvv2,
          Total: Number(amount) + "00", // Required format: adding "00"
          Currency: 1, // 1 = ILS
          CreditType: creditType,
          NumPayment: numPayments,
          Phone: phone || "",
          ParamJ: "J4",
          TransactionType: "debit",
          Comment1: transactionId || "תשלום מובנה",
          FirstName: clientName ? clientName.split(" ")[0] : "",
          LastName: clientName && clientName.includes(" ") ? clientName.split(" ").slice(1).join(" ") : "NONAME",
          ProjectNumber: settings.paymentPageId || "",
          Mail: email || ""
        }
      },
      format: "json"
    };

    console.log("================ KESHER API SEND_TRANSACTION REQUEST ================");
    // Hide CC in logs
    const safePayload = JSON.parse(JSON.stringify(payload));
    safePayload.Json.tran.CreditNum = "***" + String(creditNumber).slice(-4);
    safePayload.Json.tran.Cvv2 = "***";
    console.log(JSON.stringify(safePayload, null, 2));

    const response = await fetch("https://kesherhk.info/ConnectToKesher/ConnectToKesher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    console.log("================ KESHER API RESPONSE ================");
    console.log(resultText);

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error("Kesher Parse Error:", resultText);
      return NextResponse.json({ success: false, error: "שגיאה בפיענוח תשובת קשר" }, { status: 500 });
    }

    const requestResult = result.RequestResult || result;

    if (requestResult.Status === false || requestResult.status === "error" || requestResult.error) {
      return NextResponse.json({ success: false, error: requestResult.Description || requestResult.error || "שגיאה בשליחה למערכת קשר" }, { status: 400 });
    }

    // Encrypt the CC details to save in CRM
    const encryptedCC = encrypt(JSON.stringify({ creditNumber, expiry, cvv2 }));

    return NextResponse.json({
      success: true,
      message: requestResult.Description || "התשלום עבר בהצלחה",
      transactionId: requestResult.TransactionId || requestResult.DocUrl || resultText,
      encryptedCC
    });

  } catch (error: any) {
    console.error("Kesher SendTransaction Error:", error);
    return NextResponse.json({ success: false, error: error.message || "שגיאת שרת פנימית" }, { status: 500 });
  }
}
