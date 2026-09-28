import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import EstoquePage from "./pages/private/estoque";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<EstoquePage />} />
      <Route path="/pecas" element={<EstoquePage />} />
      <Route path="/estoque" element={<EstoquePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
