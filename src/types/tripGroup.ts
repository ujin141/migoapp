// ──────────────────────────────────────────────
// Shared types for trip groups (extracted from DiscoverPage)
// ──────────────────────────────────────────────

export interface TripGroup {
  id: string;
  title: string;
  destination: string;
  dates: string;
  currentMembers: number;
  maxMembers: number;
  tags: string[];
  hostId: string;
  hostPhoto: string;
  hostName: string;
  hostBio?: string;
  daysLeft: number;
  joined: boolean;
  description?: string;
  memberPhotos: string[];
  memberNames: string[];
  schedule?: string[];
  requirements?: string[];
  entryFee?: number;
  isPremiumGroup?: boolean;
  coverImage?: string;
  hostCompletedGroups?: number;
  recentMessages?: {
    author: string;
    text: string;
    time: string;
  }[];
}
