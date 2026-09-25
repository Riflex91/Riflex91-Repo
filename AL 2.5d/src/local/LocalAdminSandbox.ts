export const LOCAL_ADMIN_EMAIL = "local-admin@al25d.invalid";
export const LOCAL_ADMIN_CHARACTER = "LocalAdmin";

export const LOCAL_TEST_CHARACTERS = Object.freeze([
  Object.freeze({ name: "LocalAdmin", char: "warrior" }),
  Object.freeze({ name: "LocalMage", char: "mage" }),
  Object.freeze({ name: "LocalPriest", char: "priest" }),
  Object.freeze({ name: "LocalRanger", char: "ranger" })
] as const);

const LOCAL_ONLY_PASSWORD = ["al25d", "local", "sandbox"].join("-");

export type LocalAdminBootstrapResult = Readonly<{
  accountReady: boolean;
  characterReady: boolean;
  charactersReady: readonly string[];
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

export function normalizeLocalCharacterCount(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? "1"), 10);

  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(LOCAL_TEST_CHARACTERS.length, Math.trunc(parsed)));
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
 *
 * Four local test characters are provisioned so the pinned original
 * start_character runner can launch up to three companions beside LocalAdmin.
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

  const charactersReady: string[] = [];

  for (const definition of LOCAL_TEST_CHARACTERS) {
    const character = await postApi("create_character", {
      name: definition.name,
      char: definition.char,
      look: 0
    });

    const ready =
      Boolean(character.success) ||
      character.reason === "name_used" ||
      character.reason === "character_exists";

    if (!ready) {
      throw new Error(
        `Unable to create local sandbox character ${definition.name}: ${character.reason ?? "unknown"}`
      );
    }

    charactersReady.push(definition.name);
  }

  return Object.freeze({
    accountReady: true,
    characterReady: charactersReady.includes(LOCAL_ADMIN_CHARACTER),
    charactersReady: Object.freeze(charactersReady)
  });
}
