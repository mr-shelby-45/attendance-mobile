import api from "./api";

export const getColleges = async () => {
  const response = await api.get("/colleges");
  return response.data;
};

export const getUnitsByCollege = async (collegeId) => {
  const response = await api.get(`/colleges/${collegeId}/units`);
  return response.data;
};