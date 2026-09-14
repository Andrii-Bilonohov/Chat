import {
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { COLORS } from "@/constants/theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function LoginScreen() {
    const { signIn } = useAuthActions();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const resetSecondaryFields = () => {
        setPassword("");
        setName("");
    };

    const handleToggleMode = () => {
        if (isLoading) return;
        setIsSignUp((prev) => !prev);
        resetSecondaryFields();
    };

    const validate = () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            Alert.alert("Помилка", "Будь ласка, заповніть усі поля.");
            return false;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            Alert.alert("Помилка", "Некоректний формат email.");
            return false;
        }

        if (isSignUp && !name.trim()) {
            Alert.alert("Помилка", "Будь ласка, вкажіть ваше ім'я.");
            return false;
        }

        if (isSignUp && trimmedPassword.length < MIN_PASSWORD_LENGTH) {
            Alert.alert(
                "Помилка",
                `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів.`,
            );
            return false;
        }

        return true;
    };

    const handleAuth = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            if (isSignUp) {
                await signIn("password", {
                    email: email.trim(),
                    password: password.trim(),
                    name: name.trim(),
                    flow: "signUp",
                });
            } else {
                await signIn("password", {
                    email: email.trim(),
                    password: password.trim(),
                    flow: "signIn",
                });
            }
        } catch (err) {
            console.error("Auth Error", err);
            const rawMessage = err instanceof Error ? err.message : "";

            let message = isSignUp
                ? "Не вдалося зареєструватися. Спробуйте ще раз."
                : "Неправильний email або пароль.";

            if (rawMessage.includes("InvalidAccountId") || rawMessage.includes("already")) {
                message = "Ця пошта вже зареєстрована.";
            } else if (rawMessage.toLowerCase().includes("network")) {
                message = "Немає з'єднання з сервером. Перевірте інтернет.";
            }

            Alert.alert("Помилка", message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-surface"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Логотип додатку */}
                <View className="items-center mt-20">
                    <View className="w-20 h-20 rounded-3xl bg-primary/20 items-center justify-center border border-primary/30">
                        <Ionicons name="chatbubbles" size={38} color={COLORS.primary} />
                    </View>
                    <Text className="text-3xl font-bold text-white mt-5 tracking-tight">
                        Modern Chat
                    </Text>
                    <Text className="text-sm text-textMuted mt-2 text-center px-6">
                        {isSignUp
                            ? "Створіть акаунт для спілкування в кімнатах"
                            : "Увійдіть, щоб продовжити спілкування"}
                    </Text>
                </View>

                {/* Форма введення */}
                <View className="px-6 mt-12 w-full items-center gap-4">
                    {isSignUp && (
                        <View className="flex-row items-center bg-secondary border border-surfaceLight rounded-2xl px-4 w-full max-w-sm">
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={COLORS.textMuted}
                                style={{ marginRight: 12 }}
                            />
                            <TextInput
                                className="flex-1 py-3.5 text-base text-white"
                                placeholder="Ваше ім'я"
                                placeholderTextColor={COLORS.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>
                    )}

                    <View className="flex-row items-center bg-secondary border border-surfaceLight rounded-2xl px-4 w-full max-w-sm">
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color={COLORS.textMuted}
                            style={{ marginRight: 12 }}
                        />
                        <TextInput
                            className="flex-1 py-3.5 text-base text-white"
                            placeholder="Email"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            returnKeyType="next"
                        />
                    </View>

                    <View className="flex-row items-center bg-secondary border border-surfaceLight rounded-2xl px-4 w-full max-w-sm">
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={COLORS.textMuted}
                            style={{ marginRight: 12 }}
                        />
                        <TextInput
                            className="flex-1 py-3.5 text-base text-white"
                            placeholder="Пароль"
                            placeholderTextColor={COLORS.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!isLoading}
                            returnKeyType="done"
                            onSubmitEditing={handleAuth}
                        />
                    </View>

                    {/* Кнопка входу/реєстрації */}
                    <TouchableOpacity
                        className={`flex-row items-center justify-center bg-primary rounded-2xl py-4 w-full max-w-sm mt-3 active:bg-primaryDark ${isLoading ? "opacity-60" : ""
                            }`}
                        activeOpacity={0.85}
                        onPress={handleAuth}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text className="text-white text-base font-bold">
                                {isSignUp ? "Зареєструватися" : "Увійти"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Перемикач */}
                    <TouchableOpacity
                        onPress={handleToggleMode}
                        className="mt-3 py-2"
                        disabled={isLoading}
                    >
                        <Text className="text-primary text-sm font-medium">
                            {isSignUp
                                ? "Вже є акаунт? Увійти"
                                : "Немає акаунту? Створити новий"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}