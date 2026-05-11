import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HeartbeatService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async beat(sid: string) {
    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");

    console.log(`[Heartbeat] Received for session ${sid} — updating last_active_at`);

    // $queryRaw used here because Prisma's update() sets lastActiveAt from Node clock.
    // We need now() from the DB clock to stay consistent with session validation.
    const rows = await this.prisma.$queryRaw<
      { last_active_at: Date; absolute_expires_at: Date }[]
    >`
      UPDATE sessions
      SET last_active_at = now()
      WHERE id = ${sid}::uuid
      RETURNING last_active_at, absolute_expires_at
    `;

    if (!rows.length) return null;

    const { last_active_at, absolute_expires_at } = rows[0];
    const idleExpiresAt = new Date(
      last_active_at.getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    console.log(
      `[Heartbeat] DB updated — idleExpiresAt: ${idleExpiresAt.toISOString()}, absoluteExpiresAt: ${absolute_expires_at.toISOString()}`,
    );

    return {
      ok: true,
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: absolute_expires_at.toISOString(),
    };
  }
}
