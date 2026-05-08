import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as admin from "firebase-admin";
import { PG_POOL } from "../database/database.module";
import { FIREBASE_ADMIN } from "../firebase/firebase.module";

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    @Inject(PG_POOL) private pool: Pool,
    @Inject(FIREBASE_ADMIN) private firebaseAdmin: typeof admin,
  ) {}

  async login(idToken: string) {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseAdmin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException("Invalid or expired Firebase token");
    }

    const { uid, email } = decoded;
    const absoluteMaxHours = this.config.get<number>("session.absoluteMaxHours");
    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");
    const absoluteExpiresAt = new Date(Date.now() + absoluteMaxHours * 60 * 60 * 1000);

    const { rows } = await this.pool.query(
      `INSERT INTO sessions (user_id, email, absolute_expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, last_active_at`,
      [uid, email, absoluteExpiresAt],
    );

    const { id: sid, last_active_at } = rows[0];
    const idleExpiresAt = new Date(
      new Date(last_active_at).getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    return {
      sid,
      absoluteMaxHours,
      user: { email },
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
    };
  }

  async logout(sid: string | undefined) {
    if (sid) {
      await this.pool
        .query(`UPDATE sessions SET invalidated_at = now() WHERE id = $1`, [sid])
        .catch(console.error);
    }
  }

  getMe(session: any) {
    const { user_id: uid, email, last_active_at, absolute_expires_at } = session;
    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");
    const idleExpiresAt = new Date(
      new Date(last_active_at).getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    return {
      user: { email },
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: new Date(absolute_expires_at).toISOString(),
    };
  }
}
