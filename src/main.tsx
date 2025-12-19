import React from "react";
import ReactDOM from "react-dom/client";
import ThemedAppWrapper from "./atomic_design/natural_rules/theme_wrapper.tsx";
import { HelmetProvider } from "react-helmet-async";
import { store } from "./store/redux/coreRedux.ts";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./store/firebase/firebase.ts";
import { AuthProvider } from "./features/userAuthentication/provider/firebase/AuthProviderfirebase.tsx";

setPersistence(auth, browserLocalPersistence);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <HelmetProvider>
          <AuthProvider>
            <ThemedAppWrapper></ThemedAppWrapper>
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
