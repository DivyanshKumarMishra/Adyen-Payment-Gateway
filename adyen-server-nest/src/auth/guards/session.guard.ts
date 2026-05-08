import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { IS_PUBLIC } from "./public.decorator";
import { PG_POOL } from "../../database/database.module";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
    @Inject(PG_POOL) private pool: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const sid = req.cookies?.sid;

    if (!sid) throw new UnauthorizedException("No active session");

    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");

    const { rows } = await this.pool
      .query(
        `SELECT id, user_id, email, last_active_at, absolute_expires_at
         FROM sessions
         WHERE id = $1
           AND invalidated_at IS NULL
           AND now() - last_active_at < INTERVAL '${idleTimeoutMinutes} minutes'
           AND now() < absolute_expires_at`,
        [sid],
      )
      .catch((err) => {
        console.error("Session validation error:", err);
        throw new UnauthorizedException("Session validation failed");
      });

    if (!rows.length) throw new UnauthorizedException("Session expired or invalid");

    req.session = rows[0];
    return true;
  }
}
