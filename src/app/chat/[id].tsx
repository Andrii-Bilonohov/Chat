import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";

type SelectedImage = { uri: string; mimeType: string };

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const chatRoomId = id as Id<"chatRooms">;
    const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
    const messages = useQuery(api.messages.listMessages, { chatRoomId });
    const currentUser = useQuery(api.users.currentUser);
    const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

    const sendMessage = useMutation(api.messages.sendMessage);
    const editMessage = useMutation(api.messages.editMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
    const setTyping = useMutation(api.typing.setTyping);

    const [inputText, setInputText] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const lastTypingSentRef = useRef(0);

    // Прокрутка вниз тільки при зміні кількості повідомлень
    const messagesCount = messages?.length ?? 0;
    useEffect(() => {
        if (messagesCount === 0) return;
        const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        return () => clearTimeout(t);
    }, [messagesCount]);

    const handleTextChange = (text: string) => {
        setInputText(text);
        if (!text.trim() || editingMessageId) return;

        const now = Date.now();
        if (now - lastTypingSentRef.current > 1500) {
            lastTypingSentRef.current = now;
            setTyping({ chatRoomId }).catch(() => { });
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
        });

        const asset = result.canceled ? undefined : result.assets[0];
        if (asset?.uri) {
            setSelectedImage({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
        }
    };

    const startEditing = (messageId: Id<"messages">, content: string) => {
        setSelectedImage(null);
        setEditingMessageId(messageId);
        setInputText(content);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setInputText("");
    };

    const confirmDelete = (messageId: Id<"messages">) => {
        Alert.alert("Видалити повідомлення?", undefined, [
            { text: "Скасувати", style: "cancel" },
            {
                text: "Видалити",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteMessage({ messageId });
                        if (editingMessageId === messageId) cancelEditing();
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Помилка", "Не вдалося видалити повідомлення");
                    }
                },
            },
        ]);
    };

    const openMessageMenu = (messageId: Id<"messages">, content?: string) => {
        Alert.alert("Повідомлення", undefined, [
            ...(content
                ? [{ text: "Редагувати", onPress: () => startEditing(messageId, content) }]
                : []),
            { text: "Видалити", style: "destructive" as const, onPress: () => confirmDelete(messageId) },
            { text: "Скасувати", style: "cancel" as const },
        ]);
    };

    const handleSend = async () => {
        if (isSubmitting) return;
        const text = inputText.trim();

        try {
            setIsSubmitting(true);

            if (editingMessageId) {
                if (!text) return; // порожній текст при редагуванні не відправляємо
                await editMessage({ messageId: editingMessageId, content: text });
                setEditingMessageId(null);
                setInputText("");
            } else if (selectedImage) {
                const uploadUrl = await generateUploadUrl();
                const file = new File(selectedImage.uri);

                const uploadResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedImage.mimeType },
                    body: file,
                });

                if (!uploadResponse.ok) throw new Error("Upload failed");

                const { storageId } = await uploadResponse.json();
                await sendMediaMessage({
                    chatRoomId,
                    storageId,
                    caption: text || undefined,
                });

                setSelectedImage(null);
                setInputText("");
            } else if (text) {
                await sendMessage({ chatRoomId, content: text });
                setInputText("");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося відправити повідомлення");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!room || messages === undefined || currentUser === undefined) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const sendDisabled = (!inputText.trim() && !selectedImage) || isSubmitting;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
            {/* Хедер чату */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-surfaceLight">
                <View className="flex-row items-center flex-1 mr-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white text-lg font-bold" numberOfLines={1}>
                            {room.title}
                        </Text>
                        {room.description ? (
                            <Text className="text-textMuted text-xs" numberOfLines={1}>
                                {room.description}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => router.push(`/settings/${chatRoomId}`)}
                    className="p-1"
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Список повідомлень */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                renderItem={({ item }) => {
                    const isMe = item.senderId === currentUser?._id;
                    const onMenu = isMe
                        ? () => openMessageMenu(item._id, item.content || undefined)
                        : undefined;

                    return (
                        <View className={`mb-3 max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
                            <Pressable
                                onLongPress={onMenu}
                                className={`p-3 rounded-2xl ${isMe
                                    ? "bg-primary rounded-tr-sm"
                                    : "bg-surface border border-surfaceLight rounded-tl-sm"
                                    }`}
                            >
                                {!isMe && (
                                    <Text className="text-primary font-bold text-xs mb-1">
                                        {item.senderName}
                                    </Text>
                                )}

                                {item.imageUrl && (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setFullscreenImage(item.imageUrl!)}
                                        onLongPress={onMenu}
                                        className="mb-1 rounded-xl overflow-hidden"
                                    >
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            className="w-56 h-56 rounded-xl bg-surfaceLight"
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}

                                {item.content ? (
                                    <Text className="text-white text-base leading-5">{item.content}</Text>
                                ) : null}

                                <View className="flex-row items-center justify-end mt-1 gap-1">
                                    {item.isEdited && (
                                        <Text className="text-white/60 text-[10px] italic">(ред.)</Text>
                                    )}
                                    <Text className="text-white/60 text-[10px]">
                                        {new Date(item._creationTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    );
                }}
            />

            {/* Індикатор набору */}
            {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

            {/* Індикатор редагування */}
            {editingMessageId && (
                <View className="flex-row items-center px-4 py-2 bg-surfaceLight border-t border-surface">
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text className="text-white text-xs flex-1 ml-2">Редагування повідомлення</Text>
                    <TouchableOpacity onPress={cancelEditing}>
                        <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Прев'ю обраної картинки перед відправкою */}
            {selectedImage && (
                <View className="flex-row items-center px-4 py-2 bg-surfaceLight border-t border-surface">
                    <Image
                        source={{ uri: selectedImage.uri }}
                        className="w-12 h-12 rounded-lg mr-3"
                    />
                    <Text className="text-white text-xs flex-1">Фото додано до відправки</Text>
                    <TouchableOpacity onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Панель введення */}
            <View className="flex-row items-center p-3 bg-surface border-t border-surfaceLight">
                <TouchableOpacity
                    onPress={pickImage}
                    disabled={isSubmitting || !!editingMessageId}
                    className={`mr-2 p-2 rounded-full bg-surfaceLight ${editingMessageId ? "opacity-50" : ""}`}
                >
                    <Ionicons name="image-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>

                <TextInput
                    className="flex-1 bg-background text-white px-4 py-2.5 rounded-full text-base border border-surfaceLight mr-2"
                    placeholder={
                        selectedImage ? "Додайте опис до фото..." : "Напишіть повідомлення..."
                    }
                    placeholderTextColor={COLORS.textMuted}
                    value={inputText}
                    onChangeText={handleTextChange}
                    multiline
                />

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={sendDisabled}
                    className={`w-11 h-11 rounded-full items-center justify-center bg-primary ${sendDisabled ? "opacity-50" : "active:opacity-80"
                        }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name={editingMessageId ? "checkmark" : "send"} size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            <ImageViewerModal
                visible={!!fullscreenImage}
                imageUrl={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />
        </KeyboardAvoidingView>
    );
}