export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  organization: string;
  authorityLevel: 'National' | 'State' | 'District' | 'Field Officer';
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  department: string;
  organization: string;
  authorityLevel: 'National' | 'State' | 'District' | 'Field Officer';
  password?: string;
}
