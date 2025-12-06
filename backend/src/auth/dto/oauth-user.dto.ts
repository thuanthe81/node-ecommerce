export interface OAuthUserData {
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'facebook';
  providerId: string;
  username?: string;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}
