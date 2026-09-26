export const LOCAL_ADMIN_EMAIL = "local-admin@al25d.invalid";

const LOCAL_ONLY_PASSWORD = ["al25d", "local", "sandbox"].join("-");

export type LocalAdminBootstrapResult = Readonly<{
  accountReady: boolean;
}>;

type ApiResult = {
  success?: boolean;
  failed?: boolean;
  reason?: string;
};

export function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

async function postApi(
  method: string,
  body: Record<string, unknown>
): Promise<ApiResult> {
  const response = await fetch(`/api/${method}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(
      `Local sandbox API ${method} failed with HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiResult;
}

/**
 * Creates or reuses only the deliberately local Adventure Land account.
 *
 * Character creation is intentionally left to the original client UI so the
 * complete create-character flow can be tested manually. Admin behavior is
 * supplied by the upstream development configuration
 * (Local:true + unsecure_admin:true), not by changing account permissions.
 */
export async function ensureLocalAdminSession(
  hostname = window.location.hostname
): Promise<LocalAdminBootstrapResult> {
  if (!isLoopbackHostname(hostname)) {
    throw new Error(
      "Local admin sandbox is restricted to localhost/loopback hosts"
    );
  }

  let login = await postApi("signup_or_login", {
    email: LOCAL_ADMIN_EMAIL,
    password: LOCAL_ONLY_PASSWORD
  });

  if (login.failed) {
    login = await postApi("signup_or_login", {
      email: LOCAL_ADMIN_EMAIL,
      password: LOCAL_ONLY_PASSWORD,
      only_login: true
    });
  }

  if (!login.success) {
    throw new Error(
      `Unable to create/login local sandbox account: ${login.reason ?? "unknown"}`
    );
  }

  return Object.freeze({
    accountReady: true
  });
}
