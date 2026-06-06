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
