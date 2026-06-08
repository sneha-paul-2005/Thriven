import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="861923888143-krbti2bfj4an7s1jsn3gnua9kb7b7rlt.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);