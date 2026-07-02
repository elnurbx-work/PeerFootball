export type BlockRelationship = {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
};

export type BlockDecision = {
  blocked: boolean;
  blockerId?: string;
  blockedId?: string;
};
