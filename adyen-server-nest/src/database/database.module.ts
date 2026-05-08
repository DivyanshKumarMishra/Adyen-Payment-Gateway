import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get("database");
        return new Pool({
          host: db.host,
          port: db.port,
          database: db.name,
          user: db.user,
          password: db.password,
          ssl: { rejectUnauthorized: false },
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
