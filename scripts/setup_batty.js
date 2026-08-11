const admin = require("firebase-admin");

const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf8').split('\n');
  for (const line of envConfig) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  }
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
  let privateKey = "";
  if (privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
  } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Attempt default initialization
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function createBatty() {
  try {
    const slug = "BATTY";
    const workerRef = db.collection("smart_workers").doc(slug);
    const doc = await workerRef.get();
    
    const battyData = {
      name: "Betty",
      role: "Global Receptionist",
      slug: slug,
      idleVideo: "", // Placeholder for the UI to pick up
      speakingVideo: "", // Placeholder for the UI to pick up
      promoVideo: "",
      prompt_instructions: "You are Betty, the Global Receptionist of Golden Flute. Use your tools to manage contacts and show assets.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!doc.exists) {
      await workerRef.set(battyData);
      console.log(`Created smart worker ${slug} successfully.`);
    } else {
      await workerRef.set(battyData, { merge: true });
      console.log(`Updated smart worker ${slug} successfully.`);
    }
  } catch (error) {
    console.error("Error creating BATTY:", error);
  }
}

createBatty();
