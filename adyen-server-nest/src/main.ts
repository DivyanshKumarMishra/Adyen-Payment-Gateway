import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { migrate } from "./database/migrate";
import { PG_POOL } from "./database/database.module";
import { Pool } from "pg";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  });

  app.use(cookieParser());

  // Validate all incoming DTOs globally — rejects unknown fields and validates types
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = app.get(ConfigService);
  const pool = app.get<Pool>(PG_POOL);

  await migrate(pool);

  const port = config.get<number>("port");
  await app.listen(port, "0.0.0.0");
  console.log(`Server is running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
