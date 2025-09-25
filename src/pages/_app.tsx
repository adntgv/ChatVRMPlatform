import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@charcoal-ui/icons";
import { InstanceProvider } from "@/features/instances/instanceContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <InstanceProvider>
      <Component {...pageProps} />
    </InstanceProvider>
  );
}
