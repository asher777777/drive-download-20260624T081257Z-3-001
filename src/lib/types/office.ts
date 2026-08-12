import { Timestamp } from 'firebase/firestore';

export interface SmartOfficeTab {
  id: string;
  title: string;          // e.g. "analyze-mode."
  subtitle?: string;       // e.g. "user and smart worker conversion"
  mediaType: 'image' | 'video';
  mediaUrl: string;       // URL from Media Library / Firebase Storage
  tools: string[];        // Selected tools for this tab e.g. ["analytics", "scanner", "reporting"]
  permissions: string[];  // Selected permissions e.g. ["read", "write", "execute"]
  loopMedia?: boolean;    // Loop video continuously (default true)
  mutedMedia?: boolean;   // Mute video audio (default true)
  systemPrompt?: string;  // System prompt / AI instructions for this tab's tool
}

export interface SmartWorkerPermissions {
  system_db_read: boolean;
  office_db_read: boolean;
  db_write_edit_delete: boolean;
  code_files_write_edit_delete: boolean;
}

export interface SmartWorkerConfig {
  permissions: SmartWorkerPermissions;
  ai_capabilities: string[];
  primary_roles: string[];
  collaboration: string[];
  general_prompt: string;
  conversation_history_id: string;
  tts_voice_id: string;
  tone_style: string;
}

export interface SmartOfficeDocument {
  id: string;             // Firestore doc ID / slug
  slug: string;           // Unique URL slug (e.g. "david")
  officeName: string;     // e.g. "David's office."
  agentName: string;      // e.g. "David"
  agentTitle: string;     // e.g. "Check with David."
  headerBrand: string;    // e.g. "M.A.M"
  headerSubtitle: string; // e.g. "Smart digital offices"
  tabs: SmartOfficeTab[];
  smartWorkerConfig?: SmartWorkerConfig;
  ownerId: string;
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export const DEFAULT_SMART_WORKER_CONFIG: SmartWorkerConfig = {
  permissions: {
    system_db_read: true,
    office_db_read: true,
    db_write_edit_delete: false,
    code_files_write_edit_delete: false,
  },
  ai_capabilities: [
    "text_response",
    "research",
    "read_documents",
    "generate_images",
    "write_code"
  ],
  primary_roles: [
    "Advisor",
    "Analytics",
    "Automations Manager"
  ],
  collaboration: [
    "dotty-creative-worker",
    "alex-security-worker"
  ],
  general_prompt: "You are an advanced AI Smart Worker operating within the office workspace. You specialize in data analysis, strategy optimization, and automated workflow execution.",
  conversation_history_id: "",
  tts_voice_id: "en-US-Studio-O",
  tone_style: "Professional"
};

export const DEFAULT_OFFICE_DATA: SmartOfficeDocument = {
  id: 'david',
  slug: 'david',
  officeName: "David's office.",
  agentName: 'David',
  agentTitle: 'Check with David.',
  headerBrand: 'M.A.M',
  headerSubtitle: 'Smart digital offices',
  smartWorkerConfig: DEFAULT_SMART_WORKER_CONFIG,
  tabs: [
    {
      id: 'tab-1',
      title: 'analyze-mode.',
      subtitle: 'user and smart worker conversion',
      mediaType: 'image',
      mediaUrl: '/edoffice/ed.webp',
      tools: ['analytics', 'data_processor', 'conversion_tracker'],
      permissions: ['read', 'write'],
      loopMedia: true,
      mutedMedia: true,
      systemPrompt: 'You are David, a senior smart worker assistant specialized in data analysis and conversion rate optimization.'
    },
    {
      id: 'tab-2',
      title: 'growth-mode.',
      subtitle: 'smart strategy & lead intelligence',
      mediaType: 'image',
      mediaUrl: '/edoffice/ed.webp',
      tools: ['lead_gen', 'crm_sync', 'auto_responder'],
      permissions: ['read', 'execute'],
      loopMedia: true,
      mutedMedia: true,
      systemPrompt: 'Focus on growth strategy, lead capture, and CRM interaction flows.'
    }
  ],
  ownerId: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
