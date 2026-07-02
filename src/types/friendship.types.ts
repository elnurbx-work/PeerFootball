import type { FriendshipStatus as PrismaFriendshipStatus } from "@prisma/client";

export type FriendshipStatus = PrismaFriendshipStatus;

export type FriendshipUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type FriendshipWithUser = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt: Date | null;
  user: FriendshipUser;
};

export type FriendshipButtonState =
  | "ADD_FRIEND"
  | "REQUEST_SENT"
  | "RESPOND"
  | "FRIENDS"
  | "BLOCKED";

export type FriendshipStatusResult = {
  state: FriendshipButtonState;
  friendshipId?: string;
  direction?: "INCOMING" | "OUTGOING";
};

export type FriendshipActionResult<T = unknown> =
  | {
      ok: true;
      message: string;
      data?: T;
    }
  | {
      ok: false;
      message: string;
    };
