export interface register {
  name: string;
  email: string;
  password: string;
  role: 'waiter' | 'kitchen' | 'admin';
}

export interface login {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: 'waiter' | 'kitchen' | 'admin';
}
