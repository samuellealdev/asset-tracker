import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

function RedirectToDevices() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/devices", replace: true });
  }, [navigate]);

  return null;
}

export const Route = createFileRoute("/devices/create")({
  component: RedirectToDevices,
});
