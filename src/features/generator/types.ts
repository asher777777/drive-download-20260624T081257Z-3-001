export interface SmartGoals {
  s: string; // Specific
  m: string; // Measurable (KPIs)
  a: string; // Achievable
  r: string; // Relevant
  t: string; // Time-bound
}

export interface ProjectCharter {
  lockedBudget: number;
  durationDays: number;
  signedBy: string | null;
  signedAt: string | null;
}

export interface RaciMatrix {
  r: string; // Responsible (e.g. "דרוש מעצב" or dynamic user names)
  a: string; // Accountable (e.g. Project Manager)
  c: string; // Consulted
  i: string; // Informed
}

export interface WbsTask {
  id: string;
  parentId: string | null;
  title: string;
  durationDays: number;
  cost: number;
  dependencies: string[];
  raci: RaciMatrix;
}

export interface ValidatorResult {
  estimatedCostMin: number;
  estimatedCostMax: number;
  estimatedDurationDays: number;
  risks: string[];
  demandValidation: string; // Needs Validation results summary
}

export interface ProjectData {
  id?: string;
  name: string;
  type: "new" | "recurring";
  status: "draft" | "active";
  smartGoals: SmartGoals;
  charter: ProjectCharter;
  tasks: WbsTask[];
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}
