export function getDeviceType() {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return isMobile ? "MOBILE" : "DESKTOP";
}

export function renderDevice(device_type) {
  if(!device_type) return "-";
  if (device_type === "MOBILE") return "📱 Mobile";
  if (device_type === "DESKTOP") return "💻 Desktop";
  return "—"; // for old records / unknown
}