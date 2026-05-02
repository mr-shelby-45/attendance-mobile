import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { checkIn, getWeeklySummary } from "../../services/attendance.service";
import { getStoredStudent, logoutStudent } from "../../services/auth.service";
import { getUnitsByCollege } from "../../services/college.service";

const STATUS_ICON = {
  PRESENT: "✅",
  MISSED: "❌",
  PENDING: "─",
};

const STATUS_COLOR = {
  PRESENT: "#e8f5e9",
  MISSED: "#fdecea",
  PENDING: "#f5f5f5",
};

export default function CheckInScreen() {
  const [student, setStudent] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [weekNumber, setWeekNumber] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await getStoredStudent();
      setStudent(stored);

      if (stored?.collegeId) {
        const unitsData = await getUnitsByCollege(stored.collegeId);
        setUnits(unitsData);
      }

      const weekly = await getWeeklySummary();
      setWeeklySummary(weekly.summary);
      setWeekNumber(weekly.weekNumber);
    } catch (err) {
      Alert.alert("Error", "Failed to load data.");
    } finally {
      setLoadingUnits(false);
      setLoadingWeekly(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedUnit) {
      Alert.alert("Error", "Please select a unit.");
      return;
    }

    setLoading(true);
    try {
      const result = await checkIn(selectedUnit);
      Alert.alert("Success ✅", result.message);
      // Refresh weekly summary after check-in
      const weekly = await getWeeklySummary();
      setWeeklySummary(weekly.summary);
      setWeekNumber(weekly.weekNumber);
    } catch (err) {
      // Authentication cancelled or failed
      if (err.message === "AUTH_FAILED") {
        Alert.alert(
          "Authentication Failed",
          "You must verify your identity to check in."
        );
        return;
      }

      // Fake GPS detected
      if (err.message === "FAKE_GPS") {
        Alert.alert(
          "⚠️ Fake Location Detected",
          "A mock location application has been detected on your device. This attempt has been logged. You will now be logged out.",
          [
            {
              text: "OK",
              onPress: async () => {
                await logoutStudent();
                router.replace("/(auth)/login");
              },
            },
          ]
        );
        return;
      }

      // Backend errors
      Alert.alert(
        "Check-in Failed",
        err.response?.data?.error || err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutStudent();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {student?.firstName}</Text>
          <Text style={styles.subGreeting}>{student?.regNumber}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Check-in Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mark Attendance</Text>
        <Text style={styles.cardSubtitle}>
          Select your unit and check in from campus
        </Text>

        {loadingUnits ? (
          <ActivityIndicator color="#1a1a2e" style={{ marginVertical: 20 }} />
        ) : (
          <>
            <Text style={styles.label}>Select Unit</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedUnit}
                onValueChange={(val) => setSelectedUnit(val)}
              >
                <Picker.Item label="-- Select Unit --" value="" />
                {units.map((u) => (
                  <Picker.Item
                    key={u.id}
                    label={`${u.code} - ${u.name}`}
                    value={u.code}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCheckIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Check In 📍</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Weekly Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Week {weekNumber} — Attendance
        </Text>
        <Text style={styles.cardSubtitle}>
          Resets every Sunday at midnight
        </Text>

        {loadingWeekly ? (
          <ActivityIndicator color="#1a1a2e" style={{ marginVertical: 20 }} />
        ) : weeklySummary.length === 0 ? (
          <Text style={styles.emptyText}>No units found for your college.</Text>
        ) : (
          weeklySummary.map((item) => (
            <View
              key={item.unitId}
              style={[styles.weekRow, { backgroundColor: STATUS_COLOR[item.status] }]}
            >
              <View style={styles.weekRowLeft}>
                <Text style={styles.weekUnitCode}>{item.unitCode}</Text>
                <Text style={styles.weekUnitName}>{item.unitName}</Text>
              </View>
              <Text style={styles.weekStatus}>
                {STATUS_ICON[item.status]}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Reports Link */}
      <TouchableOpacity
        style={styles.reportsBtn}
        onPress={() => router.push("/(app)/reports")}
      >
        <Text style={styles.reportsBtnText}>View Full Attendance Reports →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f5f5", padding: 24, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e" },
  subGreeting: { fontSize: 14, color: "#666", marginTop: 4 },
  logout: { color: "#e74c3c", fontSize: 14, fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: "#999", marginBottom: 16 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  pickerWrapper: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  weekRowLeft: { flex: 1 },
  weekUnitCode: { fontSize: 13, fontWeight: "bold", color: "#1a1a2e" },
  weekUnitName: { fontSize: 12, color: "#666", marginTop: 2 },
  weekStatus: { fontSize: 20 },
  emptyText: { color: "#999", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  reportsBtn: { alignItems: "center", padding: 16 },
  reportsBtnText: { color: "#4a90e2", fontSize: 16, fontWeight: "bold" },
});