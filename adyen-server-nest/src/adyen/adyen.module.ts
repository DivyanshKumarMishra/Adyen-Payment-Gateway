import { Module } from "@nestjs/common";
import { AdyenController } from "./adyen.controller";
import { AdyenService } from "./adyen.service";

@Module({
  controllers: [AdyenController],
  providers: [AdyenService],
})
export class AdyenModule {}
