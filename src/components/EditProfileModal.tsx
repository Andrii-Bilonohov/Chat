import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Avatar } from "@/components/Avatar";

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    currentUser: {
        _id?: string;
        name?: string;
        username?: string;
        bio?: string;
        image?: string;
    } | null;
}

type PickedAvatar = { uri: string; mimeType: string };

function Field({
    label,
    children,
    counter,
}: {
    label: string;
    children: React.ReactNode;
    counter?: string;
}) {
    return (
        <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-textMuted text-xs font-semibold uppercase">{label}</Text>
                {counter ? <Text className="text-textMuted text-xs">{counter}</Text> : null}
            </View>
            {children}
        </View>
    );
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    onClose,
    currentUser,
}) => {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [picked, setPicked] = useState<PickedAvatar | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateUserProfile = useMutation(api.users.updateUserProfile);
    const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

    // Заполняем поля только при открытии, чтобы реактивные обновления не затирали ввод
    useEffect(() => {
        if (visible && currentUser) {
            setName(currentUser.name || "");
            setUsername(currentUser.username || "");
            setBio(currentUser.bio || "");
            setPicked(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const pickAvatar = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Потрібен доступ", "Дозвольте додатку доступ до галереї для вибору фото.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            const asset = result.canceled ? undefined : result.assets[0];
            if (asset?.uri) {
                setPicked({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося вибрати аватар");
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Помилка", "Ім'я не може бути порожнім");
            return;
        }

        try {
            setIsSubmitting(true);
            let newStorageId: string | undefined;

            if (picked) {
                const uploadUrl = await generateAvatarUploadUrl();
                const file = new File(picked.uri);

                const uploadResult = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": picked.mimeType },
                    body: file,
                });

                if (!uploadResult.ok) throw new Error("Не вдалося завантажити фото");

                const { storageId } = await uploadResult.json();
                newStorageId = storageId;
            }

            await updateUserProfile({
                name: name.trim(),
                username: username.trim().replace(/^@/, "") || undefined,
                bio: bio.trim() || undefined,
                avatarStorageId: newStorageId as any,
            });

            onClose();
        } catch (error: any) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося оновити профіль");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        "bg-secondary border border-surfaceLight rounded-xl px-4 py-3 text-white text-base";

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
                <Pressable
                    onPress={isSubmitting ? undefined : onClose}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.7)",
                    }}
                />

                <View
                    className="bg-surface rounded-t-3xl border-t border-surfaceLight px-6 pt-3"
                    style={{ maxHeight: "90%" }}
                >
                    <View className="items-center mb-3">
                        <View className="w-10 h-1 rounded-full bg-surfaceLight" />
                    </View>

                    <View className="flex-row items-center justify-between pb-4 border-b border-surfaceLight">
                        <Text className="text-white text-lg font-bold">Редагувати профіль</Text>
                        <TouchableOpacity onPress={onClose} disabled={isSubmitting} hitSlop={10}>
                            <Ionicons name="close" size={24} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
                    >
                        <View className="items-center mb-5">
                            <TouchableOpacity onPress={pickAvatar} disabled={isSubmitting} activeOpacity={0.8}>
                                <Avatar
                                    id={currentUser?._id ?? "me"}
                                    name={name}
                                    uri={picked?.uri ?? currentUser?.image}
                                    size={96}
                                />
                                <View
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center"
                                    style={{ borderWidth: 2, borderColor: COLORS.surface }}
                                >
                                </View>
                            </TouchableOpacity>
                            <Text className="text-primary text-xs font-semibold mt-2">Змінити фотографію</Text>
                        </View>

                        <Field label="Ім'я *" counter={`${name.length}/50`}>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="Ваше повне ім'я"
                                placeholderTextColor={COLORS.textMuted}
                                maxLength={50}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Нікнейм (@username)">
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="alex_dev"
                                placeholderTextColor={COLORS.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={32}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Про себе" counter={`${bio.length}/200`}>
                            <TextInput
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Розкажіть трохи про себе"
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                                maxLength={200}
                                textAlignVertical="top"
                                className={inputClass}
                                style={{ minHeight: 90 }}
                            />
                        </Field>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                            className={`bg-primary rounded-xl py-3.5 items-center justify-center ${isSubmitting ? "opacity-70" : ""
                                }`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-bold text-base">Зберегти зміни</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};