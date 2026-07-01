export type TeamRole = "OWNER" | "CAPTAIN" | "MEMBER";

export type Team = {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  position?: string | null;
  joinedAt: Date;
};
