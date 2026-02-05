import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import "@charcoal-ui/icons";
import { InstanceProvider } from "@/features/instances/instanceContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        defer
        src="http://umami.adntgv.com/script.js"
        data-website-id="2434612b-3425-4bfb-b635-3c8e4bc9e2a2"
      />
      <InstanceProvider>
        <Component {...pageProps} />
      </InstanceProvider>
    </>
  );
}
