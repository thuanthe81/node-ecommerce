import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EncryptionService } from '../../common/services/encryption.service';
import { CACHE_KEYS } from '../../common/constants';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Secure session management service
 * Stores session data in Redis with encryption
 */
@Injectable()
export class SessionService {
  private readonly sessionTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new session
   * @param sessionData - Session data to store
   * @returns Session ID
   */
  async createSession(sessionData: SessionData): Promise<string> {
    // Generate a secure session ID
    const sessionId = this.encryptionService.generateToken(32);

    // Encrypt sensitive session data
    const encryptedData = this.encryptionService.encrypt(
      JSON.stringify(sessionData),
    );

    // Store in Redis with TTL
    await this.cacheManager.set(
      CACHE_KEYS.SESSION.BY_ID(sessionId),
      encryptedData,
      this.sessionTTL * 1000, // Convert to milliseconds
    );

    return sessionId;
  }

  /**
   * Get session data
   * @param sessionId - Session ID
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const encryptedData = await this.cacheManager.get<string>(
      CACHE_KEYS.SESSION.BY_ID(sessionId),
    );

    if (!encryptedData) {
      return null;
    }

    try {
      const decryptedData = this.encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      // If decryption fails, delete the corrupted session
      await this.deleteSession(sessionId);
      return null;
    }
  }

  /**
   * Update session data
   * @param sessionId - Session ID
   * @param sessionData - Updated session data
   */
  async updateSession(
    sessionId: string,
    sessionData: Partial<SessionData>,
  ): Promise<void> {
    const existingSession = await this.getSession(sessionId);

    if (!existingSession) {
      throw new Error('Session not found');
    }

    const updatedSession = {
      ...existingSession,
      ...sessionData,
      lastActivity: new Date(),
    };

    const encryptedData = this.encryptionService.encrypt(
      JSON.stringify(updatedSession),
    );

    await this.cacheManager.set(
      CACHE_KEYS.SESSION.BY_ID(sessionId),
      encryptedData,
      this.sessionTTL * 1000,
    );
  }

  /**
   * Delete a session
   * @param sessionId - Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(CACHE_KEYS.SESSION.BY_ID(sessionId));
  }

  /**
   * Delete all sessions for a user
   * @param userId - User ID
   */
  async deleteUserSessions(userId: string): Promise<void> {
    // Note: This requires Redis SCAN command which is not directly available in cache-manager
    // For production, consider using ioredis directly or implementing a user-session mapping
    console.warn(
      'deleteUserSessions: Full implementation requires direct Redis access',
    );
  }

  /**
   * Extend session TTL (refresh session)
   * @param sessionId - Session ID
   */
  async refreshSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);

    if (sessionData) {
      await this.updateSession(sessionId, {
        lastActivity: new Date(),
      });
    }
  }

  /**
   * Validate session and check for suspicious activity
   * @param sessionId - Session ID
   * @param ipAddress - Current IP address
   * @param userAgent - Current user agent
   * @returns True if session is valid
   */
  async validateSession(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Check if session has expired (additional check)
    const sessionAge =
      new Date().getTime() - new Date(session.createdAt).getTime();
    if (sessionAge > this.sessionTTL * 1000) {
      await this.deleteSession(sessionId);
      return false;
    }

    // Optional: Check for IP address change (can be too strict for mobile users)
    // if (session.ipAddress && ipAddress && session.ipAddress !== ipAddress) {
    //   console.warn(`IP address changed for session ${sessionId}`);
    //   // Optionally invalidate session or require re-authentication
    // }

    // Optional: Check for user agent change
    // if (session.userAgent && userAgent && session.userAgent !== userAgent) {
    //   console.warn(`User agent changed for session ${sessionId}`);
    // }

    return true;
  }
}
