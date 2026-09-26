export const LOCAL_ADMIN_EMAIL = "local-admin@al25d.invalid";
export const LOCAL_ADMIN_CHARACTER = "LocalAdmin";

const LOCAL_ONLY_PASSWORD = ["al25d", "local", "sandbox"].join("-");

export type LocalAdminBootstrapResult = Readonly<{
  accountReady: boolean;
  characterReady: boolean;
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
 * Creates or reuses a deliberately local-only Adventure Land account.
 *
 * Admin behavior is supplied by the upstream development configuration
 * (Local:true + unsecure_admin:true), not by changing account permissions.
 * This function refuses to run away from a loopback hostname.
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

  const character = await postApi("create_character", {
    name: LOCAL_ADMIN_CHARACTER,
    char: "warrior",
    look: 0
  });

  const characterReady =
    Boolean(character.success) ||
    character.reason === "name_used" ||
    character.reason === "character_exists";

  if (!characterReady) {
    throw new Error(
      `Unable to create local sandbox character: ${character.reason ?? "unknown"}`
    );
  }

  return Object.freeze({
    accountReady: true,
    characterReady
  });
}
