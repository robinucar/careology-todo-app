const DEFAULT_PORT = 4000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

export const parsePort = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value.trim());

  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}.`);
  }

  return port;
};

export const env = {
  port: parsePort(process.env["PORT"]),
};
