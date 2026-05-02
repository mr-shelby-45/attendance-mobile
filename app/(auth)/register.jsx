import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerStudent } from "../../services/auth.service";
import { getColleges } from "../../services/college.service";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const data = await getColleges();
      setColleges(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load colleges.");
    }
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !regNumber || !selectedCollege) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        firstName,
        lastName,
        email,
        password,
        regNumber,
        collegeId: selectedCollege,
      });
      Alert.alert("Success", "Account created! Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      Alert.alert("Registration Failed", err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/images/jkuat-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a student</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Registration Number"
          value={regNumber}
          onChangeText={setRegNumber}
          autoCapitalize="characters"
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
           <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>      
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Select College</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedCollege}
            onValueChange={(val) => setSelectedCollege(val)}
          >
            <Picker.Item label="-- Select College --" value="" />
            {colleges.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  pickerWrapper: {
    backgroundColor: "#fff",
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
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loginBtn: { alignItems: "center" },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#4a90e2", fontWeight: "bold" },
  logo: {
  width: 120,
  height: 120,
  alignSelf: "center",
  marginBottom: 16,
  },
  inputWrapper: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 8,
  paddingHorizontal: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#e0e0e0",
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
});