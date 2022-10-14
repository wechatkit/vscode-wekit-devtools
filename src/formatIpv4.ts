export function formatIpv4(str: string | undefined) {
  if (!str) {
    return "None";
  }
  const lastF = str.lastIndexOf(":");
  return str.substring(lastF + 1);
}
