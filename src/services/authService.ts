import { UserProfile, LoginCredentials, RegisterData } from '../types/auth';

const STORAGE_KEY = 'hazardshield_auth_user';

export const DEMO_USER: UserProfile = {
  id: 'usr-admin-01',
  fullName: 'Dr. Rajesh Verma',
  email: 'admin@hazardshield.gov.in',
  role: 'Disaster Management Authority',
  department: 'National Crisis Management Cell',
  organization: 'NDMA / Ministry of Home Affairs',
  authorityLevel: 'National'
};

export const authService = {
  getCurrentUser(): UserProfile | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  async demoLogin(): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 400));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    return DEMO_USER;
  },

  async login(credentials: LoginCredentials): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Check if registered user exists in localStorage accounts list
    const accountsData = localStorage.getItem('hazardshield_accounts');
    let accounts: UserProfile[] = accountsData ? JSON.parse(accountsData) : [];
    
    let found = accounts.find(a => a.email.toLowerCase() === credentials.email.toLowerCase());

    if (!found) {
      // If logging in with demo credentials or any email, construct or use demo
      if (credentials.email.toLowerCase() === DEMO_USER.email.toLowerCase()) {
        found = DEMO_USER;
      } else {
        found = {
          id: `usr-${Date.now()}`,
          fullName: credentials.email.split('@')[0].toUpperCase() + ' Officer',
          email: credentials.email,
          role: 'Disaster Response Coordinator',
          department: 'State Emergency Operations Center',
          organization: 'State Disaster Management Authority',
          authorityLevel: 'State'
        };
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return found;
  },

  async register(data: RegisterData): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      role: `${data.authorityLevel} Disaster Response Officer`,
      department: data.department || 'Disaster Management Cell',
      organization: data.organization || 'Government Authority',
      authorityLevel: data.authorityLevel
    };

    // Save to accounts list
    const accountsData = localStorage.getItem('hazardshield_accounts');
    let accounts: UserProfile[] = accountsData ? JSON.parse(accountsData) : [];
    accounts.push(newUser);
    localStorage.setItem('hazardshield_accounts', JSON.stringify(accounts));

    // Automatically log in
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
