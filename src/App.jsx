import React from "react";
import "./App.css";
import LoginPage from "./components/LoginPage";
import TimelinePage from "./components/TimelinePage";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";

function App() {
  console.log("### App Component RENDERED ###");
  const auth = useAuth();

  if (!auth || auth.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // 2. Tentukan halaman mana yang akan ditampilkan
  return (
    <div className="min-h-screen bg-slate-100">
      {auth.user ? (
        <>
          <Header />
          <main>
            <TimelinePage />
          </main>
        </>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;
