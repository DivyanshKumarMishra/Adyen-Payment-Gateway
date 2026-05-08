import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { HeartbeatService } from "./heartbeat.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, HeartbeatService],
})
export class AuthModule {}
