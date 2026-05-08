import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { AdyenService } from "./adyen.service";
import { Public } from "../auth/guards/public.decorator";

@Controller("api/adyen")
export class AdyenController {
  constructor(private adyenService: AdyenService) {}

  @Post("sessions")
  @HttpCode(200)
  async createSession(
    @Body() body: { amount?: number; currency?: string; countryCode?: string },
  ) {
    return this.adyenService.createSession(body.amount, body.currency, body.countryCode);
  }

  @Public()
  @Post("webhooks")
  @HttpCode(200)
  handleWebhook(@Body() body: any) {
    const notificationItems =
      body?.notificationItems || body?.NotificationRequestItem;

    if (!notificationItems) {
      console.warn("Webhook received with no notification items");
      return { notificationResponse: "[accepted]" };
    }

    this.adyenService.handleWebhook(notificationItems);
    return { notificationResponse: "[accepted]" };
  }
}
