import type {
  Application,
  Contract,
  Deliverable,
  Payment,
  User,
  Project,
} from "@prisma/client";

export type ApplicationWithDetails = Application & {
  developer: Pick<User, "id" | "name" | "avatar">;
  project: Pick<Project, "id" | "title" | "status">;
};

export type ContractWithDetails = Contract & {
  project: Pick<Project, "id" | "title" | "description" | "category">;
  client: Pick<User, "id" | "name" | "avatar">;
  developer: Pick<User, "id" | "name" | "avatar">;
  payments: Payment[];
  deliverables: Deliverable[];
};

export type ApplicationCardData = {
  id: string;
  developerName: string | null;
  developerAvatar: string | null;
  developerId: string;
  coverLetter: string | null;
  proposedRate: number | null;
  status: string;
  aiScore: number | null;
  createdAt: string;
};

export type ContractCardData = {
  id: string;
  title: string;
  projectTitle: string;
  projectId: string;
  counterpartyName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};
