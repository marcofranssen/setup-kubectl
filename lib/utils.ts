export function mapOS(os: string): string {
  const mappings: Record<string, string> = {
    win32: "windows",
  };
  return mappings[os] || os;
}

export function mapArch(arch: string): string {
  const mappings: Record<string, string> = {
    x32: "386",
    x64: "amd64",
  };
  return mappings[arch] || arch;
}
