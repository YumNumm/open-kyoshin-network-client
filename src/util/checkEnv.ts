// Return variable or throw error
export function checkEnv(env: string | undefined): string {
  if (env === undefined) {
    throw Error("BROKER_URI, BROKER_TOKEN and BROKER_TOPIC must be set.");
  }

  return env;
}
