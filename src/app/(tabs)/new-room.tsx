import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { Avatar } from "@/components/Avatar";

const TITLE_MAX = 100;
const DESC_MAX = 300;

export default function NewRoomScreen() {
    const router = useRouter();
    const createRoom = useMutation(api.rooms.createRoom);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            Alert.alert("Помилка", "Будь ласка, введіть назву кімнати.");
            return;
        }

        setIsLoading(true);
        try {
            const roomId = await createRoom({
                title: trimmedTitle,
                description: description.trim() || undefined,
            });
            setTitle("");
            setDescription("");
            router.push(`/chat/${roomId}`);
        } catch (error) {
            console.error("Error creating room", error);
            Alert.alert("Помилка", "Не вдалося створити кімнату.");
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = isLoading || !title.trim();

    return (
        <TabScreenWrapper>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row items-center bg-secondary border border-surfaceLight rounded-2xl p-4 mb-6">
                        <Avatar id={title || "new"} name={title} size={52} squircle />
                        <View className="flex-1 ml-3.5">
                            <Text className="text-white text-base font-bold" numberOfLines={1}>
                                {title.trim() || "Назва кімнати"}
                            </Text>
                            <Text className="text-textMuted text-xs mt-1" numberOfLines={1}>
                                {description.trim() || "Тут з'явиться опис"}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-5">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-textMuted text-xs font-semibold uppercase">
                                Назва кімнати *
                            </Text>
                            <Text className="text-textMuted text-xs">
                                {title.length}/{TITLE_MAX}
                            </Text>
                        </View>
                        <TextInput
                            className="bg-secondary border border-surfaceLight rounded-2xl px-4 py-3.5 text-white text-base"
                            placeholder="Наприклад: Обговорення React Native"
                            placeholderTextColor={COLORS.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={TITLE_MAX}
                            editable={!isLoading}
                        />
                    </View>

                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-textMuted text-xs font-semibold uppercase">
                                Опис (необов'язково)
                            </Text>
                            <Text className="text-textMuted text-xs">
                                {description.length}/{DESC_MAX}
                            </Text>
                        </View>
                        <TextInput
                            className="bg-secondary border border-surfaceLight rounded-2xl px-4 py-3.5 text-white text-base"
                            style={{ minHeight: 110 }}
                            placeholder="Короткий опис теми спілкування..."
                            placeholderTextColor={COLORS.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={DESC_MAX}
                            textAlignVertical="top"
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isDisabled}
                        activeOpacity={0.8}
                        className={`bg-primary rounded-2xl py-4 items-center justify-center ${isDisabled ? "opacity-50" : ""
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-base font-bold">Створити кімнату</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </TabScreenWrapper>
    );
}