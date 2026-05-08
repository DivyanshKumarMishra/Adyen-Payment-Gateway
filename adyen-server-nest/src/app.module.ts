import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import configuration from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { FirebaseModule } from "./firebase/firebase.module";
import { AuthModule } from "./auth/auth.module";
import { AdyenModule } from "./adyen/adyen.module";
import { SessionGuard } from "./auth/guards/session.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || "dev"}`,
    }),
    DatabaseModule,
    FirebaseModule,
    AuthModule,
    AdyenModule,
  ],
  providers: [
    // Global guard — every route is protected by default.
    // Mark public routes with @Public() to opt out.
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
})
export class AppModule {}
