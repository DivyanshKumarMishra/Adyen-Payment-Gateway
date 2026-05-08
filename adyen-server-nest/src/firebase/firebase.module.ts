import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

export const FIREBASE_ADMIN = "FIREBASE_ADMIN";

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (!admin.apps.length) {
          const fb = config.get("firebase");
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: fb.projectId,
              clientEmail: fb.clientEmail,
              privateKey: fb.privateKey,
            }),
          });
        }
        return admin;
      },
    },
  ],
  exports: [FIREBASE_ADMIN],
})
export class FirebaseModule {}
