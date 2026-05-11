import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { Inject } from "@nestjs/common";
import { FIREBASE_ADMIN } from "../firebase/firebase.module";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
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

    const session = await this.prisma.session.create({
      data: { userId: uid, email, absoluteExpiresAt },
      select: { id: true, lastActiveAt: true },
    });

    const idleExpiresAt = new Date(
      session.lastActiveAt.getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    return {
      sid: session.id,
      absoluteMaxHours,
      user: { email },
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
    };
  }

  async logout(sid: string | undefined) {
    if (sid) {
      await this.prisma.session
        .update({ where: { id: sid }, data: { invalidatedAt: new Date() } })
        .catch(console.error);
    }
  }

  getMe(session: any) {
    const { email, lastActiveAt, absoluteExpiresAt } = session;
    const idleTimeoutMinutes = this.config.get<number>("session.idleTimeoutMinutes");
    const idleExpiresAt = new Date(
      new Date(lastActiveAt).getTime() + idleTimeoutMinutes * 60 * 1000,
    );

    return {
      user: { email },
      idleExpiresAt: idleExpiresAt.toISOString(),
      absoluteExpiresAt: new Date(absoluteExpiresAt).toISOString(),
    };
  }
}
