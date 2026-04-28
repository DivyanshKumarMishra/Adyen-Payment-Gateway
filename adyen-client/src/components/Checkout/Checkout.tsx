import { useEffect, useRef, useState, useCallback } from "react";
import { AdyenCheckout, Dropin, Card } from "@adyen/adyen-web";
import type {
  PaymentCompletedData,
  PaymentFailedData,
  AdyenCheckoutError,
} from "@adyen/adyen-web";
import "@adyen/adyen-web/styles/adyen.css";
import "./Checkout.css";
import type { Product } from "../../data/products";

const CLIENT_KEY = import.meta.env.VITE_ADYEN_CLIENT_KEY;
const API_URL =
  new URLSearchParams(window.location.search).get("apiUrl") ||
  import.meta.env.VITE_API_URL;

type CheckoutState = "loading" | "ready" | "success" | "failed";
type LogLevel = "log" | "warn" | "error";

interface CheckoutProps {
  product: Product;
}

function Checkout({ product }: CheckoutProps) {
  const dropinContainerRef = useRef<HTMLDivElement>(null);
  const dropinRef = useRef<InstanceType<typeof Dropin> | null>(null);
  const [state, setState] = useState<CheckoutState>("loading");

  const handleReady = useCallback(() => {
    setState("ready");
  }, []);

  const handleInitError = useCallback(() => {
    setState("failed");
  }, []);

  const sendLog = (message: unknown, level: LogLevel = "log") => {
    // Always log in web console
    console[level]("[Checkout]", message);

    // Send to React Native if available
    if (window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "LOG",
            level,
            message:
              typeof message === "string" ? message : JSON.stringify(message),
          }),
        );
      } catch (err) {
        console.error("[Checkout] Failed to send log to RN", err);
      }
    }
  };

  // useEffect(() => {
  //   let cancelled = false;

  //   const initCheckout = async () => {
  //     try {
  //       console.log("[Checkout] API_URL:", API_URL);
  //       const response = await fetch(`${API_URL}/sessions`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           amount: product.price,
  //           currency: "GBP",
  //           countryCode: "GB",
  //         }),
  //       });

  //       if (cancelled) return;

  //       const { id, sessionData } = await response.json();

  //       const checkout = await AdyenCheckout({
  //         environment: "test",
  //         clientKey: CLIENT_KEY,
  //         countryCode: "GB",
  //         session: { id, sessionData },
  //         onPaymentCompleted: (result: PaymentCompletedData) => {
  //           console.log("Payment completed:", result);
  //           const isSuccess = result.resultCode === "Authorised" || result.resultCode === "Received";
  //           if (isSuccess) {
  //             setState("success");
  //           } else {
  //             setState("failed");
  //           }
  //           // Notify React Native WebView if running inside one
  //           if (window.ReactNativeWebView) {
  //             window.ReactNativeWebView.postMessage(JSON.stringify({
  //               type: isSuccess ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
  //               resultCode: result.resultCode,
  //             }));
  //           }
  //         },
  //         onPaymentFailed: (result?: PaymentFailedData) => {
  //           console.log("Payment failed:", result);
  //           setState("failed");
  //           if (window.ReactNativeWebView) {
  //             window.ReactNativeWebView.postMessage(JSON.stringify({
  //               type: "PAYMENT_FAILED",
  //               resultCode: result?.resultCode,
  //             }));
  //           }
  //         },
  //         onError: (error: AdyenCheckoutError) => {
  //           console.error("Checkout error:", error);
  //         },
  //       });

  //       if (cancelled || !dropinContainerRef.current) return;

  //       dropinRef.current = new Dropin(checkout, {
  //         paymentMethodComponents: [Card],
  //         onReady: handleReady,
  //       });
  //       dropinRef.current.mount(dropinContainerRef.current);
  //     } catch (error) {
  //       console.error("Failed to initialize checkout:", error);
  //       if (!cancelled) handleInitError();
  //     }
  //   };

  //   initCheckout();

  //   return () => {
  //     cancelled = true;
  //     dropinRef.current?.unmount();
  //   };
  // }, [product, handleReady, handleInitError]);

  useEffect(() => {
    let cancelled = false;

    const initCheckout = async () => {
      try {
        let id: string;
        let sessionData: string;

        // Read injected session (from RN)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const injectedSession = (window as any).__SESSION__;

        if (injectedSession?.id && injectedSession?.sessionData) {
          sendLog("Using injected session");
          id = injectedSession.id;
          sessionData = injectedSession.sessionData;
        } else {
          // Browser flow
          sendLog("Fetching session from API");

          const response = await fetch(`${API_URL}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: product.price,
              currency: "GBP",
              countryCode: "GB",
            }),
          });

          if (cancelled) return;

          const data = await response.json();
          sendLog("Session fetched successfully");

          id = data.id;
          sessionData = data.sessionData;
        }

        sendLog("Initializing AdyenCheckout");

        const checkout = await AdyenCheckout({
          environment: "test",
          clientKey: CLIENT_KEY,
          countryCode: "GB",
          session: { id, sessionData },

          onPaymentCompleted: (result: PaymentCompletedData) => {
            const isSuccess =
              result.resultCode === "Authorised" ||
              result.resultCode === "Received";

            sendLog(
              `Payment completed: ${result.resultCode}`,
              isSuccess ? "log" : "warn",
            );

            setState(isSuccess ? "success" : "failed");

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: isSuccess ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
                  resultCode: result.resultCode,
                }),
              );
            }
          },

          onPaymentFailed: (result?: PaymentFailedData) => {
            sendLog(
              `Payment failed: ${result?.resultCode || "unknown"}`,
              "warn",
            );

            setState("failed");

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "PAYMENT_FAILED",
                  resultCode: result?.resultCode,
                }),
              );
            }
          },

          onError: (error: AdyenCheckoutError) => {
            sendLog(`Adyen error: ${error.message}`, "error");
          },
        });

        if (cancelled || !dropinContainerRef.current) return;

        sendLog("Mounting Drop-in");

        dropinRef.current = new Dropin(checkout, {
          paymentMethodComponents: [Card],
          onReady: () => {
            sendLog("Drop-in ready");
            handleReady();
          },
        });

        dropinRef.current.mount(dropinContainerRef.current);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);

        sendLog(`Init failed: ${message}`, "error");
        if (!cancelled) handleInitError();
      }
    };

    initCheckout();

    return () => {
      cancelled = true;
      dropinRef.current?.unmount();
    };
  }, [product, handleReady, handleInitError]);

  if (state === "success") {
    return (
      <div className="checkout-container">
        <div className="checkout-result checkout-result--success">
          <div className="result-icon result-icon--success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Order Confirmed!</h2>
          <p className="result-subtitle">
            Your payment has been processed successfully
          </p>
          <div className="result-details">
            <div className="result-detail-row">
              <span className="result-label">Item</span>
              <span className="result-value">{product.name}</span>
            </div>
            <div className="result-detail-row">
              <span className="result-label">Amount</span>
              <span className="result-value">{product.displayPrice}</span>
            </div>
          </div>
          <button
            className="result-btn result-btn--success"
            onClick={() => window.location.reload()}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="checkout-container">
        <div className="checkout-result checkout-result--failed">
          <div className="result-icon result-icon--failed">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2>Payment Failed</h2>
          <p className="result-subtitle">
            We couldn't process your payment. Please try again.
          </p>
          <button
            className="result-btn result-btn--failed"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {state === "loading" && (
        <div className="checkout-loader">
          <div className="checkout-spinner" />
        </div>
      )}
      <div
        ref={dropinContainerRef}
        className={state === "loading" ? "checkout-dropin--hidden" : ""}
      />
    </div>
  );
}

export default Checkout;
