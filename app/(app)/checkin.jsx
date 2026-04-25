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
import { checkIn } from "../../services/attendance.service";
import { getStoredStudent, logoutStudent } from "../../services/auth.service";
import { getUnitsByCollege } from "../../services/college.service";

export default function CheckInScreen() {
  const [student, setStudent] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    loadStudentAndUnits();
  }, []);

  const loadStudentAndUnits = async () => {
    try {
      const stored = await getStoredStudent();
      setStudent(stored);
      if (stored?.collegeId) {
        const data = await getUnitsByCollege(stored.collegeId);
        setUnits(data);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load units.");
    } finally {
      setLoadingUnits(false);
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
    } catch (err) {
      Alert.alert(
        "Check-in Failed",
        err.response?.data?.error || "Something went wrong."
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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {student?.firstName} 👋
          </Text>
          <Text style={styles.subGreeting}>{student?.regNumber}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity
        style={styles.reportsBtn}
        onPress={() => router.push("/(app)/reports")}
      >
        <Text style={styles.reportsBtnText}>View Attendance Reports →</Text>
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
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
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
  reportsBtn: { alignItems: "center", padding: 16 },
  reportsBtnText: { color: "#4a90e2", fontSize: 16, fontWeight: "bold" },
});