import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="viability-theme">
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
