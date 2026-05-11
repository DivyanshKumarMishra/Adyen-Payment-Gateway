import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { IS_PUBLIC } from "./public.decorator";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
    private prisma: PrismaService,
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
    const idleThreshold = new Date(Date.now() - idleTimeoutMinutes * 60 * 1000);

    const session = await this.prisma.session
      .findFirst({
        where: {
          id: sid,
          invalidatedAt: null,
          lastActiveAt: { gte: idleThreshold },
          absoluteExpiresAt: { gt: new Date() },
        },
      })
      .catch((err) => {
        console.error("Session validation error:", err);
        throw new UnauthorizedException("Session validation failed");
      });

    if (!session) throw new UnauthorizedException("Session expired or invalid");

    req.session = session;
    return true;
  }
}
