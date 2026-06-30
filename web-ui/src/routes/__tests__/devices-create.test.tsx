import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: Record<string, unknown>) => config,
}));

// The route's component is nested inside the createFileRoute result
// We import the Route and extract its component dynamically
import { Route } from "../devices.create";

describe("DeviceCreatePage (redirect route)", () => {
  it("redirects to /devices when rendered", async () => {
    // The Route export from createFileRoute returns { component: RedirectToDevices }
    const routeConfig = Route as unknown as { component: React.ComponentType };
    render(<routeConfig.component />);

    // useEffect triggers navigation; give it a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/devices",
      replace: true,
    });
  });
});
