export interface ISession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

export type ICreateSession = Omit<ISession, 'revoked_at' | 'created_at'>;
