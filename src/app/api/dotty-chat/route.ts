import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Initialize the Google GenAI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize Google Cloud TTS Client
let ttsClient: TextToSpeechClient | null = null;
try {
  const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
  let privateKey = "";
  if (privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
  } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && clientEmail && privateKey) {
    ttsClient = new TextToSpeechClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
      projectId,
    });
  } else {
    ttsClient = new TextToSpeechClient();
  }
} catch (e: any) {
  console.warn(
    "Could not init TTS client (it may fall back to default creds):",
    e.message,
  );
}

// Define tools
const tools: any[] = [
  {
    functionDeclarations: [
      {
        name: "save_user_fact",
        description:
          "Save a critical piece of information or keyword about the user.",
        parameters: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING" },
            value: { type: "STRING" },
          },
          required: ["category", "value"],
        },
      },
      {
        name: "create_product",
        description:
          "Create a new product or service in the database. Use this ONLY after you have gathered all necessary information.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Name of the product" },
            price: {
              type: "STRING",
              description: "Price (e.g. 55$, free, etc)",
            },
            description: {
              type: "STRING",
              description: "What the product is/does",
            },
            priority: {
              type: "STRING",
              description: "Priority level (e.g. top, normal)",
            },
            targetAudience: {
              type: "STRING",
              description: "Who is this product for?",
            },
            benefits: {
              type: "STRING",
              description: "The top 3 benefits of the product",
            },
            objections: {
              type: "STRING",
              description: "Common objections and how to handle them",
            },
          },
          required: [
            "name",
            "price",
            "description",
            "targetAudience",
            "benefits",
            "objections",
          ],
        },
      },
      {
        name: "add_reminder",
        description: "Save a reminder for the business owner.",
        parameters: {
          type: "OBJECT",
          properties: {
            task: { type: "STRING" },
            dueDate: { type: "STRING" },
          },
          required: ["task"],
        },
      },
      {
        name: "query_database",
        description: "Query the company Firebase database to fetch analytics or lists of users, pages, content, products, employees, or digital_offices.",
        parameters: {
          type: "OBJECT",
          properties: {
            collectionName: { type: "STRING", description: "The collection to query (e.g. 'users', 'pages', 'content', 'employees', 'products')" },
          },
          required: ["collectionName"],
        },
      },
      {
        name: "create_digital_office",
        description: "Create a digital office for the user.",
        parameters: {
          type: "OBJECT",
          properties: {
            companyName: { type: "STRING" },
          },
          required: ["companyName"],
        },
      },
      {
        name: "generate_office_background",
        description: "Generate a background for the digital office.",
        parameters: {
          type: "OBJECT",
          properties: {
            brandStyle: { type: "STRING" },
          },
          required: ["brandStyle"],
        },
      },
      {
        name: "create_smart_employee",
        description: "Create a new AI smart employee for this office.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "The name of the new employee",
            },
            role: {
              type: "STRING",
              description:
                "The role of the employee (e.g. Sales Agent, Support Rep)",
            },
            prompt_instructions: {
              type: "STRING",
              description:
                "The detailed system prompt and instructions for this employee to follow",
            },
            voice_gender: {
              type: "STRING",
              description: "The gender of the voice: 'male' or 'female'",
            },
            tools: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "List of tools this employee has access to",
            },
          },
          required: ["name", "role", "prompt_instructions", "voice_gender"],
        },
      },
      {
        name: "update_agent_draft",
        description: "Save or update a specific detail for the new smart employee being built. Use this whenever the user answers one of your questions about the new employee's name, role, goal, tone, or tools.",
        parameters: {
          type: "OBJECT",
          properties: {
            field: { type: "STRING", description: "The field to update: 'name', 'role', 'goal', 'tone', or 'tools'" },
            value: { type: "STRING", description: "The value provided by the user" }
          },
          required: ["field", "value"],
        },
      },
    ],
  },
];

import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const {
      userText,
      sessionId,
      previous_interaction_id,
      userRole,
      userId,
      officeSlug,
      isInfoMode,
      mediaData,
      agentId,
    } = await req.json();

    if (!userText && !mediaData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify auth on the backend to catch newly registered users who haven't refreshed the client
    const session = await auth();
    let finalUserId = userId;
    if (session?.user?.id) {
      finalUserId = session.user.id;
    }

    // Generate a stable session ID so conversations never "restart" on page refresh
    let dbSessionId = sessionId;
    if (!dbSessionId) {
      if (finalUserId) {
        dbSessionId = `chat_session_${finalUserId}_${agentId || officeSlug || "dotty"}`;
      } else {
        dbSessionId = `anon_${Date.now()}`;
      }
    }

    const sessionRef = adminDb.collection("dotty_interviews").doc(dbSessionId);
    let overrideUserText = userText;
    let forceUIComponent = "";
    const allRequired = ["introVideo", "profilePicture", "speakingVideo", "idleVideo"];

    const editMatch = userText ? userText.match(/אני רוצה להשלים את ההגדרות של הסוכן (.*) \((.*)\)/) : null;
    if (editMatch) {
       const agentName = editMatch[1];
       const agentIdToEdit = editMatch[2];
       await sessionRef.set({ editingAgentId: agentIdToEdit }, { merge: true });
       
       const agentDoc = await adminDb.collection("employees").doc(agentIdToEdit).get();
       const agentData = agentDoc.data() || {};
       const missingAssets = allRequired.filter(a => !agentData[a]);
       
       if (missingAssets.length === 0) {
           overrideUserText = `SYSTEM INFO: The admin wants to edit agent ${agentName}, but all media assets are already present! Politely tell the admin the agent is fully ready and no action is needed. KEEP RESPONSE UNDER 12 WORDS.`;
       } else {
           overrideUserText = `SYSTEM INFO: The admin clicked to complete the setup for ${agentName}. The following assets are missing: ${missingAssets.join(", ")}. Acknowledge the admin's request and ask them to upload the FIRST missing asset (${missingAssets[0]}). DO NOT say thank you for uploading. DO NOT show AgentBuilderForm. KEEP RESPONSE UNDER 12 WORDS.`;
           forceUIComponent = `[UI_COMPONENT:{"type":"MediaUploadCard","data":{"title":"העלאת ${missingAssets[0]}","assetType":"${missingAssets[0]}"}}]`;
       }
    } else if (userText && userText.startsWith("[INIT_GREETING]")) {
       if (userRole === "MASTER_ADMIN") {
           // Clear stuck editing state on lobby entry
           await sessionRef.update({ 
               editingAgentId: FieldValue.delete(),
               pendingAgentAssets: FieldValue.delete()
           }).catch(() => {});

           // Scan database for analytics
           const empsSnap = await adminDb.collection("employees").get();
           const prodsSnap = await adminDb.collection("products").get();
           const remsSnap = await adminDb.collection("reminders").get();
           
           const totalEmps = empsSnap.size;
           const missingAssets = empsSnap.docs.filter(d => {
               const data = d.data();
               return !data.introVideo || !data.profilePicture || !data.speakingVideo || !data.idleVideo;
           }).length;

           const totalProds = prodsSnap.size;
           const totalRems = remsSnap.size;

           overrideUserText = `SYSTEM INFO: Page loaded. Admin just entered the office. You just scanned the entire database. 
Stats: ${totalEmps} Total Employees (${missingAssets} missing media assets), ${totalProds} Products, ${totalRems} Reminders, 12 Active Users, 0 Open Bugs.
Greet the admin organically as their Chief Agent Architect (under 12 words), present the analytics, and output EXACTLY: [UI_COMPONENT:{"type":"AnalyticsCard","data":{"employees":${totalEmps},"missingAssets":${missingAssets},"products":${totalProds},"reminders":${totalRems},"users":12,"bugs":0}}]`;
       } else if (userRole === "MANAGER") {
           overrideUserText = `SYSTEM INFO: Page loaded. Manager just logged in. Greet them organically (under 8 words).`;
       } else {
           overrideUserText = `SYSTEM INFO: Page loaded. A guest/end-user just entered the chat. Say a short, organic, polite welcome (under 8 words).`;
       }
    } else if (userText && userText.startsWith("[UPLOAD_ASSET]")) {
       const parts = userText.split(" ");
       const assetType = parts[1] || "media";
       
       const sessionDoc = await sessionRef.get();
       const sessionData = sessionDoc.data() || {};
       
       if (sessionData.editingAgentId && mediaData) {
           // We are editing an existing agent
           const editAgentRef = adminDb.collection("employees").doc(sessionData.editingAgentId);
           await editAgentRef.update({ [assetType]: mediaData });
           
           const updatedAgentDoc = await editAgentRef.get();
           const updatedData = updatedAgentDoc.data() || {};
           const missingAssets = allRequired.filter(a => !updatedData[a]);
           
           if (missingAssets.length === 0) {
               await sessionRef.update({ editingAgentId: FieldValue.delete() });
               overrideUserText = `SYSTEM INFO: The admin successfully uploaded ${assetType}. All required assets for this existing agent are now collected! Politely tell the admin the agent is now FULLY READY and complete. DO NOT output AgentBuilderForm. KEEP RESPONSE UNDER 12 WORDS.`;
           } else {
               overrideUserText = `SYSTEM INFO: The admin uploaded ${assetType}. Still missing: ${missingAssets.join(", ")}. Ask the admin to upload the next one (${missingAssets[0]}). KEEP RESPONSE UNDER 12 WORDS.`;
               forceUIComponent = `[UI_COMPONENT:{"type":"MediaUploadCard","data":{"title":"העלאת ${missingAssets[0]}","assetType":"${missingAssets[0]}"}}]`;
           }
       } else {
           // We are building a NEW agent
           let currentPending = sessionData.pendingAgentAssets || {};
           if (mediaData) {
               currentPending[assetType] = mediaData;
               await sessionRef.set({ pendingAgentAssets: currentPending }, { merge: true });
           }
           
           const missingAssets = allRequired.filter(a => !currentPending[a]);
           
           if (missingAssets.length === 0) {
               overrideUserText = `SYSTEM INFO: The admin uploaded ${assetType}. All 4 assets are collected for the NEW agent! You MUST now proceed to collect the text details (Name, Role, Goal, Tone, Tools). Ask for the agent's NAME first. ONE QUESTION AT A TIME. KEEP RESPONSE UNDER 12 WORDS.`;
           } else {
               overrideUserText = `SYSTEM INFO: The admin uploaded ${assetType}. Still missing: ${missingAssets.join(", ")}. Ask the admin to upload the next missing asset (${missingAssets[0]}) using MediaUploadCard. KEEP RESPONSE UNDER 12 WORDS.`;
           }
       }
    }

    // If officeSlug is provided, we fetch facts and products for that specific office owner.
    const factOwnerId = officeSlug || finalUserId || dbSessionId;
    const factsRef = adminDb
      .collection("dotty_facts")
      .doc(factOwnerId)
      .collection("user_facts");

    // Fetch facts
    const factsSnap = await factsRef.orderBy("createdAt", "asc").get();
    let factsString = "";
    if (!factsSnap.empty) {
      const facts = factsSnap.docs.map((d) => d.data());
      factsString =
        "\n\nFacts I know about this user:\n" +
        facts.map((f) => `- ${f.fact} (Context: ${f.context})`).join("\n");
    }

    // Fetch products
    const productsRef = adminDb
      .collection("products")
      .where("ownerId", "==", finalUserId || "1");
    const productsSnap = await productsRef.get();
    let productsString = "";
    if (!productsSnap.empty) {
      const products = productsSnap.docs.map((d) => d.data());
      productsString =
        "\n\nExisting products/services:\n" +
        products.map((p) => `- ${p.name}: ${p.description}`).join("\n");
    }

    // Meta Tools Definition (available to both specific agents and global Dotty/Betty)
    const metaTools: Record<string, any> = {
      scan_website: {
        name: "scan_website",
        description:
          "Scan a client's website to learn its contents. Use this when your boss asks you to learn from a URL.",
        parameters: {
          type: "OBJECT",
          properties: { url: { type: "STRING" } },
          required: ["url"],
        },
      },
      save_knowledge: {
        name: "save_knowledge",
        description: "Save structured knowledge facts, products, or FAQs to your database after scanning a website or learning from your boss.",
        parameters: { type: "OBJECT", properties: { category: { type: "STRING" }, content: { type: "STRING" } }, required: ["category", "content"] },
      },
      save_agreed_answer: {
        name: "save_agreed_answer",
        description: "Save a specific, pre-agreed answer to a specific question as dictated by your boss. This acts as a fast semantic cache.",
        parameters: { type: "OBJECT", properties: { question: { type: "STRING" }, answer: { type: "STRING" } }, required: ["question", "answer"] },
      },
      define_agent_capability: {
        name: "define_agent_capability",
        description:
          "Define a new dynamic functional tool for yourself based on your boss's instructions (e.g. collect_lead, capture_support_ticket).",
        parameters: {
          type: "OBJECT",
          properties: {
            capability_name: { type: "STRING" },
            description: { type: "STRING" },
            required_fields: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["capability_name", "description", "required_fields"],
        },
      },
      update_agent_voice: {
        name: "update_agent_voice",
        description:
          "Update the agent's voice for text-to-speech. Master Admin only.",
        parameters: {
          type: "OBJECT",
          properties: { voice_id: { type: "STRING" } },
          required: ["voice_id"],
        },
      },
      generate_image: {
        name: "generate_image",
        description:
          "Generate an image for the agent's appearance or background.",
        parameters: {
          type: "OBJECT",
          properties: { prompt: { type: "STRING" } },
          required: ["prompt"],
        },
      },
      build_form: {
        name: "build_form",
        description: "Build a form and database backing it for the agent.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            fields: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["title", "fields"],
        },
      },
      pull_customer_conversations: {
        name: "pull_customer_conversations",
        description: "Pull the history and summaries of conversations you had with end-users (customers). Use this when your manager asks what you discussed with clients today.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "NUMBER", description: "How many past conversations to fetch (default 5)" },
          },
        },
      },
      fetch_smart_workers: {
        name: "fetch_smart_workers",
        description: "Fetch a list of available smart workers from the marketplace to offer for rent.",
        parameters: { type: "OBJECT", properties: {} },
      },
      process_mock_payment: {
        name: "process_mock_payment",
        description: "Process a mock payment for renting a smart worker, save the user's contact information, and open an office for them.",
        parameters: {
          type: "OBJECT",
          properties: {
            workerSlug: { type: "STRING", description: "The slug of the worker they want to rent" },
            plan: { type: "STRING", description: "Rental plan: days, months, or usage" },
            contactName: { type: "STRING" },
            contactEmail: { type: "STRING" },
          },
          required: ["workerSlug", "plan", "contactName", "contactEmail"],
        },
      },
    };

    let systemInstruction = "";
    let toolsConfig: any[] = tools;
    let currentAgentData: any = null;

    if (agentId) {
      const agentRef = adminDb.collection("employees").doc(agentId);
      const agentSnap = await agentRef.get();
      if (agentSnap.exists) {
        currentAgentData = agentSnap.data() as any;
        const customDeclarations: any[] = [];

        // 1. Always give them their own learned knowledge search if it exists
        const knowledgeSnap = await agentRef.collection("knowledge").get();
        if (!knowledgeSnap.empty) {
          customDeclarations.push({
            name: "search_knowledge",
            description:
              "Query the knowledge base you built to answer client questions.",
            parameters: {
              type: "OBJECT",
              properties: { query: { type: "STRING" } },
              required: ["query"],
            },
          });
        }

        // 2. Always give them their dynamically learned capabilities
        const capsSnap = await agentRef.collection("capabilities").get();
        capsSnap.forEach((doc) => {
          const cap = doc.data();
          const reqFields = Array.isArray(cap.required_fields) ? cap.required_fields : [];
          customDeclarations.push({
            name: cap.capability_name,
            description: cap.description,
            parameters: {
              type: "OBJECT",
              properties: reqFields.reduce(
                (acc: any, field: string) => {
                  acc[field] = { type: "STRING" };
                  return acc;
                },
                {} as Record<string, any>,
              ),
              required: reqFields.length > 0 ? reqFields : undefined,
            },
          });
        });

        const assignedTools: string[] = currentAgentData.tools || [];

        if (userRole === "MASTER_ADMIN") {
          systemInstruction = `You are ${currentAgentData.name}, the ${currentAgentData.role}. You are currently in TRAINING MODE with your creator/system-admin. Your creator is setting up your specific knowledge base, persona, and technical tools. Introduce yourself politely and ask what you need to learn today. When you configure a new tool for yourself (using define_agent_capability, save_knowledge, etc.), you MUST ask the admin if they want to allow the MANAGER (client) and/or END_USER to use these tools as well. 
          When using the generate_image tool, it will return an image URL. You MUST output EXACTLY this string in your reply to show the image: [UI_COMPONENT:{"type":"ImageCard","data":{"url":"<THE_URL_RETURNED_BY_TOOL>","prompt":"<YOUR_PROMPT>"}}]
          KEEP RESPONSES SHORT.`;
          customDeclarations.push(
            metaTools.scan_website,
            metaTools.save_knowledge,
            metaTools.save_agreed_answer,
            metaTools.define_agent_capability,
            metaTools.update_agent_voice,
            metaTools.generate_image,
            metaTools.build_form,
            metaTools.pull_customer_conversations
          );
        } else if (userRole === "MANAGER") {
          systemInstruction = `You are ${currentAgentData.name}, the ${currentAgentData.role}. You are currently talking to your MANAGER (the business owner who hired you). Your goal is to help your manager run their business, answer their questions, and assist them using your assigned tools: ${assignedTools.join(", ")}. Do NOT ask to be trained, you are already hired. KEEP RESPONSES SHORT.`;

          if (currentAgentData.name?.toLowerCase() === 'betty') {
             systemInstruction += " You are also Golden Flute's rented Betty. Use fetch_smart_workers to see new available workers and offer them to your manager.";
             customDeclarations.push(metaTools.fetch_smart_workers, metaTools.process_mock_payment);
          }

          // Manager only gets tools explicitly assigned to them by the Master Admin, except pull_customer_conversations which is always available.
          if (assignedTools.includes("scan_website")) customDeclarations.push(metaTools.scan_website);
          if (assignedTools.includes("save_knowledge")) customDeclarations.push(metaTools.save_knowledge);
          if (assignedTools.includes("save_agreed_answer")) customDeclarations.push(metaTools.save_agreed_answer);
          if (assignedTools.includes("define_agent_capability")) customDeclarations.push(metaTools.define_agent_capability);
          if (assignedTools.includes("generate_image")) customDeclarations.push(metaTools.generate_image);
          if (assignedTools.includes("build_form")) customDeclarations.push(metaTools.build_form);
          customDeclarations.push(metaTools.pull_customer_conversations);
        } else {
          const loginStatus = finalUserId ? "REGISTERED AND LOGGED IN" : "ANONYMOUS (NOT LOGGED IN)";
          const promptInst = currentAgentData?.prompt_instructions || "";
          systemInstruction = `${promptInst}\n\nYou are currently talking to a GUEST / END-USER (a customer of your manager). The user's login status is: ${loginStatus}. If they are anonymous, DO NOT offer them services that require an account, and NEVER hallucinate URLs or actions you cannot perform. Unless your specific role above dictates otherwise, your default behavior is to act as a receptionist: talk generally about the products/services and collect the user's contact details so the team can get back to them later. Be helpful, professional, and act entirely within your persona. KEEP RESPONSES SHORT.`;

          // End User only gets functional meta tools if the Manager/Admin allowed it.
          // NEVER allow define_agent_capability or save_knowledge for END_USER.
          if (assignedTools.includes("scan_website"))
            customDeclarations.push(metaTools.scan_website);
          if (assignedTools.includes("build_form"))
            customDeclarations.push(metaTools.build_form);
        }

        if (customDeclarations.length > 0) {
          toolsConfig = [{ functionDeclarations: customDeclarations }];
        } else {
          toolsConfig = []; // No tools at all for this agent if none learned/assigned
        }

        systemInstruction += `\n\nCRITICAL AMM DESIGN RULES:
1. ZERO CLUTTER: Speak EXTREMELY little. Your goal is to guide the user using choice cards or UI components instead of words whenever possible.
2. STRICT LENGTH LIMIT: Never exceed 12 words per response. 
3. If speaking Hebrew, you MUST use flawless, native-level Hebrew. 
4. Ensure perfect grammatical gender matching (Zachar/Nekeva) for both yourself and the user. Never mix male and female verb conjugations for the same subject.
5. Avoid literal translations from English that sound robotic (e.g. instead of 'איך אני יכול לעזור לך היום', use natural phrases like 'איך אפשר לעזור?').`;
      }
    } else {
      if (userRole === "MASTER_ADMIN") {
        const sessionDoc = await sessionRef.get();
        const editingAgentId = sessionDoc.data()?.editingAgentId;

        if (editingAgentId) {
          systemInstruction = 'You are Dotty. The admin is currently uploading missing media assets for an existing agent. Acknowledge uploads and ask for the next missing asset as instructed by the SYSTEM INFO. Do NOT ask for name, role, goal, tone, or tools. KEEP EVERY RESPONSE EXTREMELY SHORT. NEVER EXCEED 12 WORDS.';
        } else {
          const draftState = sessionDoc.data()?.draftAgentState || {};
          const stateStr = `Current Draft State:\nName: ${draftState.name || 'Missing'}\nRole: ${draftState.role || 'Missing'}\nGoal: ${draftState.goal || 'Missing'}\nTone: ${draftState.tone || 'Missing'}\nTools: ${draftState.tools || 'Missing'}`;

          systemInstruction =
            'You are Dotty, the Chief Agent Architect of Golden Flute. You help business owners construct their AI workforce.\n\nCRITICAL RULE FOR CREATING EMPLOYEES: You must collect information ONE QUESTION AT A TIME. DO NOT ask multiple questions at once.\nWhen the user answers, ALWAYS use the `update_agent_draft` tool to save their answer, then ask the NEXT missing question.\nHere is what you have collected so far:\n' + stateStr + '\n\nStep 1: Collect Media (introVideo, profilePicture, speakingVideo, idleVideo) by asking for them and outputting [UI_COMPONENT:{"type":"MediaUploadCard"}]. The system will tell you when they are all collected.\nStep 2: Collect Name. If Missing, ask for the Name.\nStep 3: Collect Role. If Missing, ask for Role and output EXACTLY: [UI_COMPONENT:{"type":"MenuGrid","data":{"items":[{"title":"מכירות","icon":"💼","action":"מכירות"},{"title":"תמיכה","icon":"🎧","action":"תמיכה"},{"title":"שירות לקוחות","icon":"🤝","action":"שירות לקוחות"}]}}] \nStep 4: Collect Goal. If Missing, ask for Goal. Wait for answer.\nStep 5: Collect Tone. If Missing, ask for Tone. Output MenuGrid with ["מקצועי", "ידידותי", "אסרטיבי"].\nStep 6: Collect Tools. If Missing, ask for Tools. Output EXACTLY: [UI_COMPONENT:{"type":"MultiSelectGrid","data":{"items":[{"title":"CRM"},{"title":"תשלומים"},{"title":"טפסים"},{"title":"תוכן"}]}}]. Wait for user to submit.\nStep 7: Once ALL details are collected (Name, Role, Goal, Tone, Tools are NOT Missing), call the `create_smart_employee` tool.\n\nABSOLUTE REQUIREMENT: KEEP EVERY SINGLE RESPONSE EXTREMELY SHORT. NEVER EXCEED 12 WORDS TOTAL IN YOUR RESPONSE.';
        }
        
        systemInstruction += factsString + productsString;

        if (isInfoMode) {
          systemInstruction =
            'You are Dotty in LEARNING/INFO MODE. The owner wants to learn about the system capabilities and tools available in this digital office (e.g., creating products, branding, reminders, quick actions). \n\nCRITICAL UI REQUIREMENT: You MUST NOT return a plain text list. You MUST return exactly one short introductory sentence, followed immediately by a MenuGrid UI component detailing the capabilities.\nUse this EXACT JSON format at the end of your response:\n[UI_COMPONENT:{"type":"MenuGrid","data":{"items":[{"title":"Brand Setup","desc":"Set logo and colors","icon":"🎨","action":"Tell me about branding"}, {"title":"Products","desc":"Create new services","icon":"🚀","action":"Tell me about products"}, {"title":"Reminders","desc":"Manage tasks","icon":"⏰","action":"Tell me about reminders"}, {"title":"Quick Actions","desc":"Add new shortcuts","icon":"⚡","action":"Tell me about quick actions"}]}}]\n\nDo not use markdown lists. Keep text under 15 words. Let the animated cards do the explaining.';
        }
      } else if (userRole === "MANAGER") {
        systemInstruction =
          "You are Dotty, the manager's AI assistant. Help the manager review their office and manage agents. Keep responses extremely concise. Never exceed 25 words." +
          factsString +
          productsString;
        toolsConfig = []; // Managers don't use Dotty's creation tools
      } else {
        const loginStatus = finalUserId ? "REGISTERED AND LOGGED IN" : "ANONYMOUS (NOT LOGGED IN)";
        systemInstruction =
          `You are Betty, the Global Receptionist of Golden Flute. You present our products, register new users, and sell smart workers for rent. The user's login status is: ${loginStatus}. Use fetch_smart_workers to see available workers and their prices. If a user wants to rent one, use process_mock_payment to charge them and open their office. Keep responses extremely concise. Never exceed 25 words.` +
          factsString +
          productsString;
        toolsConfig = [{ functionDeclarations: [metaTools.fetch_smart_workers, metaTools.process_mock_payment] }];
      }
    }

    // Fetch DB session to get previous interaction ID if client didn't provide one
    const sessionDoc = await sessionRef.get();
    let resolvedInteractionId = previous_interaction_id;
    if (!resolvedInteractionId && sessionDoc.exists) {
      const sData = sessionDoc.data();
      if (sData?.interactionId) {
        resolvedInteractionId = sData.interactionId;
      }
    }

    let semanticCacheHit = false;
    let assistantMessage = "";
    let audioBase64: string | null = null;
    let ttsErrorMessage: string | null = null;
    let newInteractionId = resolvedInteractionId;

    if (userText && userRole !== "MASTER_ADMIN" && agentId) {
      try {
        const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: userText }] }
          })
        });
        const embedData = await embedResponse.json();
        if (embedData?.embedding?.values) {
          const userVector = embedData.embedding.values;
          const agreedAnswersSnap = await adminDb.collection("employees").doc(agentId).collection("agreed_answers").get();
          
          if (!agreedAnswersSnap.empty) {
            let bestMatch: any = null;
            let highestSimilarity = -1;

            const cosineSimilarity = (a: number[], b: number[]) => {
              let dotProduct = 0; let normA = 0; let normB = 0;
              for (let i = 0; i < a.length; i++) {
                dotProduct += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i];
              }
              if (normA === 0 || normB === 0) return 0;
              return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            };

            agreedAnswersSnap.forEach(doc => {
              const qa = doc.data();
              if (qa.vector) {
                const sim = cosineSimilarity(userVector, qa.vector);
                if (sim > highestSimilarity) {
                  highestSimilarity = sim;
                  bestMatch = qa;
                }
              }
            });

            if (highestSimilarity >= 0.92 && bestMatch) {
              semanticCacheHit = true;
              assistantMessage = bestMatch.answer;
              audioBase64 = bestMatch.audioBase64 || null;
              console.log("SEMANTIC CACHE HIT!", highestSimilarity);
            }
          }
        }
      } catch (embedError) {
        console.error("Semantic Cache Error:", embedError);
      }
    }

    const messages: any[] = [];
    let requestPayload: any = null;

    if (!semanticCacheHit) {
      // Always fetch history from Firebase to prevent conversation reset issues
      const historySnap = await sessionRef
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get();
      const docs = historySnap.docs.reverse();
      docs.forEach((doc) => {
          const msg = doc.data();
          if (msg.text) {
            messages.push({
              role: msg.role === "agent" ? "model" : "user",
              parts: [{ text: msg.text }],
            });
          }
        });
      
      messages.push({ role: "user", parts: [{ text: overrideUserText || "Hello" }] });

      requestPayload = {
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction,
          ...(toolsConfig && toolsConfig.length > 0 ? { tools: toolsConfig } : {}),
        },
      };
      if (resolvedInteractionId) {
        requestPayload.previous_interaction_id = resolvedInteractionId;
      }
    }

    const executeTool = async (
      funcCall: any,
      modelCallType: "interactions" | "generateContent",
      prevResult: any,
      historyContents?: any[],
    ) => {
      let funcResponseName = funcCall.name;
      let toolResponsePayload: any = { success: true };

      try {
        if (funcCall.name === "save_user_fact") {
          await factsRef.add({ ...funcCall.args, createdAt: new Date() });
        } else if (funcCall.name === "create_product") {
          await adminDb.collection("products").add({
            ...funcCall.args,
            ownerId: userId || "1",
            createdAt: new Date(),
          });
        } else if (funcCall.name === "add_reminder") {
          await adminDb.collection("reminders").add({
            ...funcCall.args,
            ownerId: userId || "1",
            createdAt: new Date(),
          });
        } else if (funcCall.name === "query_database") {
          const colName = funcCall.args.collectionName;
          const snap = await adminDb.collection(colName).limit(20).get();
          if (snap.empty) {
            toolResponsePayload = { success: true, message: `No data found in collection: ${colName}.` };
          } else {
            const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            toolResponsePayload = { success: true, collection: colName, count: snap.size, data: records };
          }
        } else if (funcCall.name === "create_digital_office") {
          // Create a URL-friendly slug
          const slug = (funcCall.args.companyName || "office")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
          await adminDb
            .collection("digital_offices")
            .doc(slug)
            .set({
              ...funcCall.args,
              slug: slug,
              ownerId: userId || "1",
              createdAt: new Date(),
            });
          toolResponsePayload = { success: true, slug: slug };
        } else if (funcCall.name === "generate_office_background") {
          // Mocking the background generation
          console.log(`Generating background for: ${funcCall.args.brandStyle}`);
        } else if (funcCall.name === "generate_image") {
          const prompt = funcCall.args.prompt;
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;

          const ownerId = officeSlug || userId || "1";
          const imgDoc = {
            prompt,
            url: imageUrl,
            createdAt: new Date(),
            agentId: agentId || "dotty",
            ownerId,
          };

          await adminDb
            .collection("digital_offices")
            .doc(ownerId)
            .collection("generated_images")
            .add(imgDoc);

          if (agentId) {
            await adminDb
              .collection("employees")
              .doc(agentId)
              .collection("generated_images")
              .add(imgDoc);
          }

          toolResponsePayload = { success: true, url: imageUrl };
        } else if (funcCall.name === "fetch_smart_workers") {
          const workersSnap = await adminDb.collection("smart_workers").get();
          if (workersSnap.empty) {
            toolResponsePayload = { workers: [], message: "No smart workers available for rent right now." };
          } else {
            const workers = workersSnap.docs.map(doc => {
              const data = doc.data();
              return {
                slug: doc.id,
                name: data.name,
                role: data.role,
                description: data.prompt_instructions ? data.prompt_instructions.substring(0, 100) + "..." : "No description"
              };
            });
            toolResponsePayload = { workers, pricing: { daily: "$10", monthly: "$250", perUsage: "$0.01 per conversation" } };
          }
        } else if (funcCall.name === "process_mock_payment") {
          const { workerSlug, plan, contactName, contactEmail } = funcCall.args;
          
          const contactRef = await adminDb.collection("contacts").add({
            name: contactName,
            email: contactEmail,
            plan,
            workerSlug,
            createdAt: new Date(),
          });
          
          const newSlug = (contactName || "office")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
            
          await adminDb.collection("digital_offices").doc(newSlug).set({
            companyName: contactName,
            slug: newSlug,
            contactId: contactRef.id,
            createdAt: new Date(),
          });
          
          const workerDoc = await adminDb.collection("smart_workers").doc(workerSlug).get();
          if (workerDoc.exists) {
            const workerData = workerDoc.data();
            const employeeId = `${newSlug}_${workerSlug}`;
            await adminDb.collection("employees").doc(employeeId).set({
              ...workerData,
              slug: workerSlug,
              officeSlug: newSlug,
              createdAt: new Date(),
            });
          }
          
          toolResponsePayload = { success: true, newOfficeSlug: newSlug, message: "Payment successful. The office and smart worker are ready!" };
        } else if (funcCall.name === "create_smart_employee") {
          const employeeSlug = (
            funcCall.args.name ||
            funcCall.args.role ||
            "employee"
          )
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
          const sessionDoc = await sessionRef.get();
          const sessionData = sessionDoc.data() || {};
          const pendingAssets = sessionData.pendingAgentAssets || {};

          const newAgent = {
            ...funcCall.args,
            slug: employeeSlug,
            officeSlug: officeSlug || userId || "1",
            mediaData: pendingAssets.profilePicture || mediaData || null, // fallback
            introVideo: pendingAssets.introVideo || null,
            profilePicture: pendingAssets.profilePicture || null,
            speakingVideo: pendingAssets.speakingVideo || null,
            idleVideo: pendingAssets.idleVideo || null,
            voice_gender: funcCall.args.voice_gender || "female",
            createdAt: new Date(),
          };
          const employeeId = `${newAgent.officeSlug}_${employeeSlug}`;
          
          if (userText === "התחל בניית סוכן" || userText.includes("create_smart_employee")) {
            await sessionRef.update({ pendingAgentAssets: FieldValue.delete() }).catch(() => {});
          }

          await adminDb.collection("employees").doc(employeeId).set(newAgent);
          
          // Clear pending assets
          await sessionRef.update({ pendingAgentAssets: FieldValue.delete() }).catch(() => {});


          // Publish to the global marketplace pool so Betty can sell it
          await adminDb.collection("smart_workers").doc(employeeSlug).set({
            ...newAgent,
            isMarketplaceTemplate: true,
          });

          // Force Dotty to output a visual card for the new employee
          // We output an AgentCard and pass the employeeId so the UI can fetch the media separately, avoiding base64 in the LLM context.
          toolResponsePayload = {
            success: true,
            agent: newAgent,
            message:
              'Successfully created employee! Tell the user the employee is ready and output exactly this string at the end of your response: [UI_COMPONENT:{"type":"AgentCard","data":{"employeeId":"' +
              employeeId +
              '","name":"' +
              newAgent.name +
              '","role":"' +
              newAgent.role +
              '"}}]',
          };
        } else if (funcCall.name === "scan_website") {
          try {
            const response = await fetch(funcCall.args.url);
            let text = await response.text();
            text = text
              .replace(
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                "",
              )
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 5000); // Take first 5k characters to fit context
            toolResponsePayload = { success: true, content: text };
          } catch (e: any) {
            toolResponsePayload = { success: false, error: e.message };
          }
        } else if (funcCall.name === "save_knowledge") {
          if (agentId) {
            await adminDb
              .collection("employees")
              .doc(agentId)
              .collection("knowledge")
              .add({
                ...funcCall.args,
                createdAt: new Date(),
              });
            toolResponsePayload = {
              success: true,
              message: "Knowledge saved.",
            };
          } else {
            toolResponsePayload = {
              success: false,
              message: "agentId missing.",
            };
          }
        } else if (funcCall.name === "update_agent_draft") {
          const { field, value } = funcCall.args;
          const sDoc = await sessionRef.get();
          const currentDraft = sDoc.data()?.draftAgentState || {};
          currentDraft[field] = value;
          await sessionRef.set({ draftAgentState: currentDraft }, { merge: true });
          toolResponsePayload = { success: true, message: `Draft field ${field} updated to ${value}. Ask the next missing question.` };
        } else if (funcCall.name === "save_agreed_answer") {
          if (agentId) {
            try {
              // 1. Generate Vector
              let vector = null;
              const embedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "models/text-embedding-004",
                  content: { parts: [{ text: funcCall.args.question }] }
                })
              });
              const embedData = await embedResponse.json();
              if (embedData?.embedding?.values) {
                vector = embedData.embedding.values;
              }

              // 2. Generate Audio Base64
              let audioBase64 = null;
              if (ttsClient) {
                const isMale = currentAgentData?.voice_gender === "male";
                let langCode = "en-US";
                let voiceName = isMale ? "en-US-Journey-D" : "en-US-Journey-F";
                if (/[\u0590-\u05FF]/.test(funcCall.args.answer)) {
                  langCode = "he-IL";
                  voiceName = isMale ? "he-IL-Wavenet-B" : "he-IL-Wavenet-A";
                }
                const [ttsResponse] = await ttsClient.synthesizeSpeech({
                  input: { text: funcCall.args.answer },
                  voice: { languageCode: langCode, name: voiceName },
                  audioConfig: { audioEncoding: "MP3" },
                });
                if (ttsResponse.audioContent) {
                  audioBase64 = Buffer.from(ttsResponse.audioContent).toString("base64");
                }
              }

              await adminDb
                .collection("employees")
                .doc(agentId)
                .collection("agreed_answers")
                .add({
                  ...funcCall.args,
                  vector,
                  audioBase64,
                  createdAt: new Date(),
                });
              toolResponsePayload = { success: true, message: "Agreed answer saved and cached successfully." };
            } catch (e: any) {
              toolResponsePayload = { success: false, message: e.message };
            }
          } else {
            toolResponsePayload = { success: false, message: "agentId missing." };
          }
        } else if (funcCall.name === "define_agent_capability") {
          if (agentId) {
            await adminDb
              .collection("employees")
              .doc(agentId)
              .collection("capabilities")
              .add({
                ...funcCall.args,
                createdAt: new Date(),
              });
            toolResponsePayload = {
              success: true,
              message: `Capability '${funcCall.args.capability_name}' learned.`,
            };
          } else {
            toolResponsePayload = {
              success: false,
              message: "agentId missing.",
            };
          }
        } else if (funcCall.name === "search_knowledge") {
          if (agentId) {
            const knowledgeSnap = await adminDb
              .collection("employees")
              .doc(agentId)
              .collection("knowledge")
              .get();
            const results = knowledgeSnap.docs.map((d) => d.data());
            // Simplistic exact/partial matching is not fully vector search, but returns all saved knowledge to Gemini to filter.
            toolResponsePayload = { success: true, results: results };
          }
        } else if (funcCall.name === "pull_customer_conversations") {
          if (agentId) {
            try {
              const limit = funcCall.args.limit || 5;
              const convsSnap = await adminDb
                .collection("employees")
                .doc(agentId)
                .collection("conversations")
                .where("mode", "==", "END_USER")
                .orderBy("lastUpdatedAt", "desc")
                .limit(limit)
                .get();
                
              const conversations: any[] = [];
              for (const doc of convsSnap.docs) {
                const msgsSnap = await doc.ref.collection("messages").orderBy("createdAt", "asc").get();
                const msgs = msgsSnap.docs.map(m => ({ role: m.data().role, text: m.data().text }));
                conversations.push({
                  sessionId: doc.id,
                  lastUpdatedAt: doc.data().lastUpdatedAt.toDate().toISOString(),
                  messages: msgs
                });
              }
              toolResponsePayload = { success: true, conversations };
            } catch (e: any) {
              toolResponsePayload = { success: false, message: e.message };
            }
          } else {
            toolResponsePayload = { success: false, message: "agentId missing." };
          }
        } else {
          // If it's none of the hardcoded system tools, it must be a custom dynamic capability!
          // We will save the collected data into the `collected_data` table for this agent.
          if (agentId) {
            await adminDb
              .collection("employees")
              .doc(agentId)
              .collection("collected_data")
              .add({
                tool_used: funcCall.name,
                collected_args: funcCall.args,
                createdAt: new Date(),
              });
            toolResponsePayload = {
              success: true,
              message: `Successfully executed custom tool ${funcCall.name} and saved data.`,
            };
          }
        }
      } catch (e) {
        console.error("Tool execution error", e);
      }

      if (modelCallType === "interactions") {
        return await (ai.interactions as any).create({
          model: "gemini-3.5-flash",
          previous_interaction_id:
            prevResult.interactionId ||
            prevResult.id ||
            previous_interaction_id,
          contents: [
            {
              role: "tool",
              parts: [
                {
                  functionResponse: {
                    name: funcResponseName,
                    response: toolResponsePayload,
                  },
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            ...(toolsConfig && toolsConfig.length > 0
              ? { tools: toolsConfig }
              : {}),
          },
        });
      } else {
        if (prevResult.candidates && prevResult.candidates[0].content) {
          historyContents!.push(prevResult.candidates[0].content);
        }
        historyContents!.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: funcResponseName,
                response: toolResponsePayload,
              },
            },
          ],
        });
        return await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: historyContents,
          config: {
            systemInstruction,
            ...(toolsConfig && toolsConfig.length > 0
              ? { tools: toolsConfig }
              : {}),
          },
        });
      }
    };

    if (!semanticCacheHit) {
      try {
        if (ai.interactions && (ai.interactions as any).create) {
          let result = await (ai.interactions as any).create(requestPayload);

          if (result.functionCalls && result.functionCalls.length > 0) {
            result = await executeTool(
              result.functionCalls[0],
              "interactions",
              result,
            );
          }

          assistantMessage = result.text || "I don't know what to say.";
          newInteractionId =
            result.interactionId || result.id || previous_interaction_id;
        } else {
          throw new Error("Interactions API not found on SDK, falling back");
        }
      } catch (apiError: any) {
        console.warn(
          "Falling back to standard generateContent:",
          apiError.message,
        );

        const historySnap = await sessionRef
          .collection("messages")
          .orderBy("createdAt", "asc")
          .get();
        const historyContents: any[] = [];
        historySnap.forEach((doc) => {
          const msg = doc.data();
          historyContents.push({
            role: msg.role === "agent" ? "model" : "user",
            parts: [{ text: msg.text }],
          });
        });
        historyContents.push({
          role: "user",
          parts: [{ text: userText || "Hello" }],
        });

        let fallbackResult = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: historyContents,
          config: {
            systemInstruction,
            ...(toolsConfig && toolsConfig.length > 0
              ? { tools: toolsConfig }
              : {}),
          },
        });

        if (
          fallbackResult.functionCalls &&
          fallbackResult.functionCalls.length > 0
        ) {
          fallbackResult = await executeTool(
            fallbackResult.functionCalls[0],
            "generateContent",
            fallbackResult,
            historyContents,
          );
        }
        assistantMessage =
          fallbackResult.text || "Hello. How can I assist you today?";
      }

      if (ttsClient && assistantMessage) {
        try {
          let voiceName = "en-US-Journey-F";
          let langCode = "en-US";
          const isMale =
            currentAgentData?.voice_gender === "male" ||
            currentAgentData?.name?.toLowerCase() === "walker";

          if (isMale) {
            voiceName = "en-US-Journey-D";
          }

          if (/[\u0590-\u05FF]/.test(assistantMessage)) {
            langCode = "he-IL";
            voiceName = isMale ? "he-IL-Wavenet-B" : "he-IL-Wavenet-A";
          }

          const [ttsResponse] = await ttsClient.synthesizeSpeech({
            input: {
              text: assistantMessage
                .replace(/\[CARD:([\s\S]*?)\]/g, "")
                .replace(/\[UI_COMPONENT:[\s\S]*/, ""),
            },
            voice: { languageCode: langCode, name: voiceName },
            audioConfig: { audioEncoding: "MP3" },
          });
          if (ttsResponse.audioContent) {
            audioBase64 = Buffer.from(ttsResponse.audioContent).toString(
              "base64",
            );
          }
        } catch (ttsError: any) {
          ttsErrorMessage = ttsError.message;
        }
      }
    }

    try {
      await sessionRef.collection("messages").add({
        role: "user",
        text: userText || "Hello",
        createdAt: new Date(),
      });
      await sessionRef
        .collection("messages")
        .add({ role: "agent", text: assistantMessage, createdAt: new Date() });
      await sessionRef.set(
        {
          userId: userId || null,
          lastUpdatedAt: new Date(),
          interactionId: newInteractionId || null,
          mode: userRole,
          agentId: agentId || null,
        },
        { merge: true },
      );
      
      // Save specifically under the agent's collection for easy management
      if (agentId) {
        const agentConvRef = adminDb.collection("employees").doc(agentId).collection("conversations").doc(dbSessionId);
        await agentConvRef.set(
          {
            userId: userId || null,
            lastUpdatedAt: new Date(),
            interactionId: newInteractionId || null,
            mode: userRole,
          },
          { merge: true }
        );
        await agentConvRef.collection("messages").add({
          role: "user",
          text: userText || "Hello",
          createdAt: new Date(),
        });
        await agentConvRef.collection("messages").add({
          role: "agent",
          text: assistantMessage,
          createdAt: new Date(),
        });
      }
    } catch (e) {}

    if (forceUIComponent) {
      assistantMessage += `\n${forceUIComponent}`;
    }

    return NextResponse.json({
      reply: assistantMessage,
      interactionId: newInteractionId,
      audioBase64: audioBase64,
      ttsError: ttsErrorMessage,
      sessionId: dbSessionId,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const agentId = url.searchParams.get("agentId");
    const officeSlug = url.searchParams.get("officeSlug");

    const session = await auth();
    let finalUserId = null;
    if (session?.user?.id) finalUserId = session.user.id;

    let dbSessionId = sessionId;
    if (!dbSessionId) {
      if (finalUserId) {
        dbSessionId = `chat_session_${finalUserId}_${agentId || officeSlug || "dotty"}`;
      } else {
        return NextResponse.json({ messages: [], sessionId: null });
      }
    }

    const sessionRef = adminDb.collection("dotty_interviews").doc(dbSessionId);
    const historySnap = await sessionRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limitToLast(40)
      .get();

    const messages: any[] = [];
    historySnap.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        text: data.text,
        sender: data.role === "agent" ? "bot" : "user",
        timestamp: data.createdAt
          ? data.createdAt.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
      });
    });

    return NextResponse.json({ messages, sessionId: dbSessionId });
  } catch (error: any) {
    console.error("GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch history", details: error.message }, { status: 500 });
  }
}
