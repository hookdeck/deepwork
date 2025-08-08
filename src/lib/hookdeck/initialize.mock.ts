import type {
  StoredConnections,
  BasicAuthCredentials,
} from "../../types/hookdeck";

/**
 * Mock implementation of Hookdeck initialization for testing without actual API calls
 */
export async function ensureHookdeckConnectionsMock(): Promise<StoredConnections> {
  console.log("Using mock Hookdeck initialization");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock connection data
  return {
    queue: {
      id: "conn_mock_queue_123",
      sourceUrl: "https://hkdk.events/mock-queue-source",
    },
    webhook: {
      id: "conn_mock_webhook_456",
      sourceUrl: "https://hkdk.events/mock-webhook-source",
    },
  };
}

export async function getSourceAuthCredentialsMock(): Promise<BasicAuthCredentials> {
  return {
    username: "deepwork",
    password: "mock-password-123",
    encoded: Buffer.from("deepwork:mock-password-123").toString("base64"),
  };
}

export async function clearHookdeckConnectionsMock(): Promise<void> {
  console.log("Mock: Cleared Hookdeck connections");
}
