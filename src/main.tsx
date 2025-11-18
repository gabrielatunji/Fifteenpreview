
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { WagmiProviderWrapper } from "./providers/WagmiProvider";

  createRoot(document.getElementById("root")!).render(
    <WagmiProviderWrapper>
      <App />
    </WagmiProviderWrapper>
  );
  