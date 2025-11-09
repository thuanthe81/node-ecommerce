export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory storage for refresh tokens (in production, use Redis or database)
export class RefreshTokenStore {
  private static tokens: Map<string, RefreshToken> = new Map();

  static save(token: RefreshToken): void {
    this.tokens.set(token.token, token);
  }

  static findByToken(token: string): RefreshToken | undefined {
    return this.tokens.get(token);
  }

  static deleteByToken(token: string): void {
    this.tokens.delete(token);
  }

  static deleteByUserId(userId: string): void {
    for (const [key, value] of this.tokens.entries()) {
      if (value.userId === userId) {
        this.tokens.delete(key);
      }
    }
  }

  static cleanup(): void {
    const now = new Date();
    for (const [key, value] of this.tokens.entries()) {
      if (value.expiresAt < now) {
        this.tokens.delete(key);
      }
    }
  }
}
