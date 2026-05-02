import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
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
import { generateReport, getAttendanceSummary } from "../../services/attendance.service";

export default function ReportsScreen() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await getAttendanceSummary();
      setSummary(data.summary);
    } catch (err) {
      Alert.alert("Error", "Failed to load attendance reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const data = await generateReport();

      // Convert array buffer to base64
      const bytes = new Uint8Array(data);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Save to device
      const fileUri = FileSystem.documentDirectory + "attendance_report.pdf";
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share/open the PDF
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Save or Share Attendance Report",
        });
      } else {
        Alert.alert("Saved", `Report saved to: ${fileUri}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to generate report. Please try again.");
      console.log("Report error:", err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Reports</Text>

        {/* Generate PDF Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateBtnText}>📄 Download PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#1a1a2e" size="large" style={{ marginTop: 40 }} />
      ) : summary.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No attendance records yet.</Text>
          <Text style={styles.emptySubtext}>
            Check in to a class to see your records here.
          </Text>
        </View>
      ) : (
        summary.map((item) => (
          <View key={item.unitCode} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.unitCode}>{item.unitCode}</Text>
              <Text style={styles.count}>{item.totalAttended} classes</Text>
            </View>
            <Text style={styles.unitName}>{item.unitName}</Text>
            <View style={styles.divider} />
            {item.sessions.map((session, index) => (
              <View key={index} style={styles.session}>
                <Text style={styles.sessionDate}>
                  {new Date(session.date).toLocaleDateString("en-KE", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <View
                  style={[
                    styles.badge,
                    session.status === "PRESENT" ? styles.present : styles.flagged,
                  ]}
                >
                  <Text style={styles.badgeText}>{session.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f5f5", padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  back: { color: "#4a90e2", fontSize: 16, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a1a2e", marginBottom: 16 },
  generateBtn: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  generateBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#666", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#999", textAlign: "center" },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  unitCode: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e" },
  count: { fontSize: 14, color: "#4a90e2", fontWeight: "bold" },
  unitName: { fontSize: 14, color: "#666", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 12 },
  session: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDate: { fontSize: 13, color: "#666" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  present: { backgroundColor: "#e8f5e9" },
  flagged: { backgroundColor: "#fdecea" },
  badgeText: { fontSize: 11, fontWeight: "bold", color: "#333" },
});