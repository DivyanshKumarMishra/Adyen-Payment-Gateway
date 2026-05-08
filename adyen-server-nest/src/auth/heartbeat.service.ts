import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";

@Injectable()
export class HeartbeatService {
  constructor(
    private config: ConfigService,
    @Inject(PG_POOL) private pool: Pool,
  ) {}

  async beat(sid: string) {
    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");

    console.log(`[Heartbeat] Received for session ${sid} — updating last_active_at`);

    const { rows } = await this.pool
      .query(
        `UPDATE sessions SET last_active_at = now() WHERE id = $1 RETURNING last_active_at, absolute_expires_at`,
        [sid],
      )
      .catch((err) => {
        console.error("[Heartbeat] DB update failed:", err);
        return { rows: [] };
      });

    if (!rows.length) return null;

    const { last_active_at, absolute_expires_at } = rows[0];
    const idleExpiresAt = new Date(
      new Date(last_active_at).getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    console.log(
      `[Heartbeat] DB updated — idleExpiresAt: ${idleExpiresAt.toISOString()}, absoluteExpiresAt: ${new Date(absolute_expires_at).toISOString()}`,
    );

    return {
      ok: true,
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: new Date(absolute_expires_at).toISOString(),
    };
  }
}
