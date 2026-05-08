import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client, Config, CheckoutAPI } from "@adyen/api-library";
import { v4 as uuid } from "uuid";

@Injectable()
export class AdyenService {
  private checkout: CheckoutAPI;
  private paymentStatuses = new Map<string, any>();

  constructor(private config: ConfigService) {
    const adyen = this.config.get("adyen");
    const adyenConfig = new Config();
    adyenConfig.apiKey = adyen.apiKey;
    adyenConfig.environment = adyen.environment;

    const client = new Client(adyenConfig as any);
    this.checkout = new CheckoutAPI(client);
  }

  async createSession(amount = 1000, currency = "GBP", countryCode = "GB") {
    const orderRef = uuid();
    const merchantAccount = this.config.get<string>("adyen.merchantAccount");

    const response = await this.checkout.PaymentsApi.sessions({
      amount: { currency, value: amount },
      countryCode,
      merchantAccount,
      reference: orderRef,
      returnUrl: `http://localhost:5173/checkout?orderRef=${orderRef}`,
    });

    this.paymentStatuses.set(orderRef, { status: "pending" });

    return {
      id: response.id,
      sessionData: response.sessionData,
      orderRef,
    };
  }

  handleWebhook(notificationItems: any[]) {
    for (const item of notificationItems) {
      const notification = item.NotificationRequestItem;
      const orderRef = notification.merchantReference;

      console.log("Webhook received:", {
        eventCode: notification.eventCode,
        pspReference: notification.pspReference,
        merchantReference: orderRef,
        success: notification.success,
        paymentMethod: notification.paymentMethod,
      });

      if (notification.eventCode === "AUTHORISATION") {
        const status = notification.success === "true" ? "success" : "failed";
        this.paymentStatuses.set(orderRef, {
          status,
          pspReference: notification.pspReference,
          paymentMethod: notification.paymentMethod,
          eventCode: notification.eventCode,
        });
        console.log(`[Webhook] Order ${orderRef} updated to: ${status}`);
      }
    }
  }
}
