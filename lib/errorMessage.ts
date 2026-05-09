export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "error", "details", "hint", "code"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return fallback;
}
