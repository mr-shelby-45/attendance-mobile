import * as Device from "expo-device";
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

export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied. Required for attendance check-in.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const checkIn = async (unitCode) => {
  const location = await getCurrentLocation();
  const deviceInfo = getDeviceInfo();

  const response = await api.post("/attendance/check-in", {
    unitCode,
    latitude: location.latitude,
    longitude: location.longitude,
    deviceInfo,
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