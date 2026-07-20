// src/routes/bakery-admin-2026.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AdminPortal } from "@/components/AdminPortal";
import { Toaster } from "sonner";

export const Route = createFileRoute("/bakery-admin-2026")({
  component: () => (
    <>
      <AdminPortal />
      <Toaster position="top-right" richColors />
    </>
  ),
});