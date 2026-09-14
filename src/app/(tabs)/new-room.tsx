import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";

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
            router.replace(`/chat/${roomId}` as any);
        } catch (error) {
            console.error("Error creating room", error);
            Alert.alert("Помилка", "Не вдалося створити кімнату.");
            setIsLoading(false);
        }
    };

    const isDisabled = isLoading || !title.trim();

    return (
        <TabScreenWrapper>
            <KeyboardAvoidingView
                className="flex-1 bg-surface"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >

                <View className="flex-1 p-6 justify-between">
                    <View className="gap-4 mt-2">
                        <View>
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
                                autoFocus
                            />
                        </View>

                        <View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-textMuted text-xs font-semibold uppercase">
                                    Опис (необов'язково)
                                </Text>
                                <Text className="text-textMuted text-xs">
                                    {description.length}/{DESC_MAX}
                                </Text>
                            </View>
                            <TextInput
                                className="bg-secondary border border-surfaceLight rounded-2xl px-4 py-3.5 text-white text-base min-h-[100px]"
                                placeholder="Короткий опис теми спілкування..."
                                placeholderTextColor={COLORS.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                maxLength={DESC_MAX}
                                textAlignVertical="top"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isDisabled}
                        className={`bg-primary rounded-2xl py-4 items-center justify-center mb-4 ${isDisabled ? "opacity-50" : "active:opacity-80"
                            }`}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-base font-bold">Створити</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TabScreenWrapper>
    );
}