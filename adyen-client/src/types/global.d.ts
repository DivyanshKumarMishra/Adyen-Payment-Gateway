interface Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
  __ADYEN_SESSION__?: {
    id: string;
    sessionData: string;
  };
}
