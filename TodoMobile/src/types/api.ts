export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  hashed_password: string; // backend accepts raw password string in 'hashed_password' key
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: string;
  phonenumber?: string;
}

export interface ApiError {
  detail?: string | Array<{ msg: string }>;
  message?: string;
}
