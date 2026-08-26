import { NextRequest, NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

export const dynamic = "force-dynamic";

function getTtsClient() {
  const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
  let privateKey = "";
  if (privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
  } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "c-g-ltd";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && clientEmail && privateKey) {
    return new textToSpeech.TextToSpeechClient({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
  }

  return new textToSpeech.TextToSpeechClient({ projectId });
}

let ttsClient: any = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceName = "he-IL-Neural2-A", languageCode = "he-IL" } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!ttsClient) {
      ttsClient = getTtsClient();
    }

    const request = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: "MP3" as const },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      visemeData: [],
    });
  } catch (error: any) {
    console.error("Error in /api/speak route:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
