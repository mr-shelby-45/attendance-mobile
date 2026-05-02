import * as Device from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
import api from "./api";

export const getDeviceInfo = () => {
  return {
    deviceId: Device.osInternalBuildId || Device.modelId,
    deviceName: Device.deviceName,
    brand: Device.brand,
    osName: Device.osName,
    osVersion: Device.osVersion,
    modelName: Device.modelName,
  };
};

// ── Biometric / PIN Authentication ───────────────────────────────────────────
export const authenticateWithBiometrics = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    // Device has no biometrics or none enrolled — fall back to device PIN
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify your identity to check in",
      fallbackLabel: "Use PIN",
      disableDeviceFallback: false,
    });
    return result.success;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Use fingerprint or PIN to check in",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: false,
    cancelLabel: "Cancel",
  });

  return result.success;
};

// ── Location + Mock GPS Detection ────────────────────────────────────────────
export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied. Required for attendance check-in.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  // Check if mock location is enabled (with safe fallback)
  try {
    const isMocked = await Location.isLocationMockEnabledAsync();
    if (isMocked) {
      throw new Error("FAKE_GPS");
    }
  } catch (mockErr) {
    if (mockErr.message === "FAKE_GPS") throw mockErr;
    
    console.log("Mock location check, not supported on this device");
  }

  // Check suspiciously perfect accuracy (real GPS is never 0)
  const accuracy = location.coords.accuracy;
  if (accuracy !== null && accuracy < 2) {
    throw new Error("FAKE_GPS");
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
};

// ── Check In ─────────────────────────────────────────────────────────────────
export const checkIn = async (unitCode) => {
  // Step 1 — Biometric/PIN authentication
  const authenticated = await authenticateWithBiometrics();
  if (!authenticated) {
    throw new Error("AUTH_FAILED");
  }

  // Step 2 — Get location + detect fake GPS
  const location = await getCurrentLocation();
  const deviceInfo = getDeviceInfo();

  // Step 3 — Send to backend
  const response = await api.post("/attendance/check-in", {
    unitCode,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    deviceInfo,
    isMocked: false,
  });

  return response.data;
};

export const getMyAttendance = async (unitCode) => {
  const params = unitCode ? { unitCode } : {};
  const response = await api.get("/attendance/my", { params });
  return response.data;
};

export const getAttendanceSummary = async () => {
  const response = await api.get("/reports/summary");
  return response.data;
};

export const getWeeklySummary = async () => {
  const response = await api.get("/attendance/weekly");
  return response.data;
};

export const generateReport = async () => {
  const response = await api.get("/reports/generate", {
    responseType: "arraybuffer",
  });
  return response.data;
};