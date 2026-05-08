import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { HeartbeatService } from "./heartbeat.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./guards/public.decorator";
import { ConfigService } from "@nestjs/config";

@Controller("api/auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private heartbeatService: HeartbeatService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { sid, absoluteMaxHours, user, idleExpiresAt, absoluteExpiresAt } =
      await this.authService.login(dto.idToken);

    res
      .cookie("sid", sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod",
        sameSite: "strict",
        maxAge: absoluteMaxHours * 60 * 60 * 1000,
        path: "/",
      })
      .json({ user, idleExpiresAt, absoluteExpiresAt });
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authService.logout(req.cookies?.sid);
    res.clearCookie("sid", { path: "/" }).json({ ok: true });
  }

  @Get("me")
  me(@Req() req: Request) {
    return this.authService.getMe((req as any).session);
  }

  @Post("heartbeat")
  @HttpCode(200)
  async heartbeat(@Req() req: Request) {
    const sid = req.cookies?.sid;
    if (!sid) throw new UnauthorizedException("No active session");

    const result = await this.heartbeatService.beat(sid);
    if (!result) throw new UnauthorizedException("Session not found");

    return result;
  }
}
