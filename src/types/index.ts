export interface PostComment {
  id: string;
  author: string;
  photo: string;
  text: string;
  time: string;
  liked?: boolean;
  likes?: number;
}

export interface Post {
  id: string;
  author: string;
  photo: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
  commentList: PostComment[];
  imageUrl?: string;
  images?: string[];
  authorId: string;
  locationTag?: { lat: number; lng: number; name: string };
}

export interface TripGroup {
  id: string;
  title: string;
  destination: string;
  departure?: string;
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
  memberGenders?: ('male' | 'female' | 'unknown')[]; 
  schedule?: string[];
  requirements?: string[];
  entryFee?: number;
  isPremiumGroup?: boolean;
  coverImage?: string;
  hostCompletedGroups?: number;
  distanceKm?: number;
  recentMessages?: {
    author: string;
    text: string;
    time: string;
  }[];
  avgRating?: number;
  hasProblematicUsers?: boolean;
}
