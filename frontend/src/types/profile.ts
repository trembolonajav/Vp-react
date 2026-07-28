export interface Profile {
  username: string;
  avatar: string;
  bio: string;
  contact: string;
  preferredContact: string;
  createdAt: string;
}

export interface ProfileUpdate {
  bio: string;
  contact: string;
  preferredContact: string;
  avatar: string;
}
