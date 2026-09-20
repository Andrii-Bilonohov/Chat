import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { COLORS } from "@/constants/theme";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { Avatar } from "@/components/Avatar";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";
import { SwipeableMessageItem, MessageItemData } from "@/components/SwipeableMessageItem";
import { ReplyPreviewBar, ReplyTarget } from "@/components/ReplyPreviewBar";

type SelectedImage = { uri: string; mimeType: string };

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const keyboardVisible = useKeyboardVisible();

    const chatRoomId = id as Id<"chatRooms">;
    const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
    const messages = useQuery(api.messages.listMessages, { chatRoomId });
    const currentUser = useQuery(api.users.currentUser);
    const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

    const sendMessage = useMutation(api.messages.sendMessage);
    const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const editMessage = useMutation(api.messages.editMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const setTyping = useMutation(api.typing.setTyping);

    const [inputText, setInputText] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const lastTypingCallRef = useRef<number>(0);
    const didInitialScroll = useRef(false);

    const messagesCount = messages?.length ?? 0;
    useEffect(() => {
        if (messagesCount === 0) return;
        const animated = didInitialScroll.current;
        didInitialScroll.current = true;
        const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 60);
        return () => clearTimeout(t);
    }, [messagesCount]);

    const handleTextChange = (text: string) => {
        setInputText(text);
        if (!text.trim() || editingMessageId) return;

        const now = Date.now();
        if (now - lastTypingCallRef.current > 1500) {
            lastTypingCallRef.current = now;
            setTyping({ chatRoomId }).catch(console.error);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Дозвіл потрібен", "Надайте доступ до медіатеки для надсилання фотографій.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                quality: 0.8,
            });

            const asset = result.canceled ? undefined : result.assets[0];
            if (asset?.uri) {
                setSelectedImage({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося вибрати зображення");
        }
    };

    const handleStartReply = (msg: MessageItemData) => {
        setReplyTarget({
            messageId: msg._id,
            senderName: msg.senderName,
            text: msg.content || (msg.imageUrl ? "📷 Фотографія" : ""),
        });
        setEditingMessageId(null);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setInputText("");
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if ((!text && !selectedImage) || isSubmitting) return;

        try {
            setIsSubmitting(true);

            if (editingMessageId) {
                if (!text) return;
                await editMessage({ messageId: editingMessageId, content: text });
                setEditingMessageId(null);
            } else if (selectedImage) {
                const uploadUrl = await generateUploadUrl();
                const file = new File(selectedImage.uri);

                const uploadResult = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedImage.mimeType },
                    body: file,
                });

                if (!uploadResult.ok) throw new Error("Не вдалося завантажити зображення");

                const { storageId } = await uploadResult.json();

                await sendMediaMessage({
                    chatRoomId,
                    storageId,
                    caption: text || undefined,
                    replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
                    replyToSender: replyTarget?.senderName,
                    replyToText: replyTarget?.text,
                });

                setSelectedImage(null);
                setReplyTarget(null);
            } else {
                await sendMessage({
                    chatRoomId,
                    content: text,
                    replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
                    replyToSender: replyTarget?.senderName,
                    replyToText: replyTarget?.text,
                });
                setReplyTarget(null);
            }

            setInputText("");
        } catch (error) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося надіслати повідомлення");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMessageLongPress = (item: MessageItemData) => {
        const isOwn = item.senderId === currentUser?._id;

        const options: any[] = [{ text: "Відповісти", onPress: () => handleStartReply(item) }];

        if (isOwn) {
            if (item.content) {
                options.push({
                    text: "Редагувати",
                    onPress: () => {
                        setSelectedImage(null);
                        setEditingMessageId(item._id);
                        setInputText(item.content || "");
                        setReplyTarget(null);
                    },
                });
            }

            options.push({
                text: "Видалити",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Видалити повідомлення?", "Ви впевнені, що хочете видалити повідомлення?", [
                        { text: "Скасувати", style: "cancel" },
                        {
                            text: "Так, видалити",
                            style: "destructive",
                            onPress: () =>
                                deleteMessage({ messageId: item._id }).catch((e) => {
                                    console.error(e);
                                    Alert.alert("Помилка", "Не вдалося видалити повідомлення");
                                }),
                        },
                    ]);
                },
            });
        }

        options.push({ text: "Скасувати", style: "cancel" });
        Alert.alert("Дії з повідомленням", undefined, options);
    };

    // Комнату удалили (например, автор с другого устройства)
    if (room === null) {
        return (
            <View
                className="flex-1 bg-background items-center justify-center px-8"
                style={{ paddingTop: insets.top }}
            >
                <View className="w-20 h-20 rounded-3xl bg-secondary border border-surfaceLight items-center justify-center mb-5">
                    <Ionicons name="trash-outline" size={34} color={COLORS.textMuted} />
                </View>
                <Text className="text-white text-xl font-bold text-center mb-2">Кімнату видалено</Text>
                <Text className="text-textMuted text-sm text-center mb-6">
                    Ця кімната більше не існує
                </Text>
                <TouchableOpacity
                    onPress={() => router.replace("/(tabs)")}
                    activeOpacity={0.85}
                    className="bg-primary px-6 py-3 rounded-full"
                >
                    <Text className="text-white font-semibold">До списку чатів</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sendDisabled = (!inputText.trim() && !selectedImage) || isSubmitting;
    const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 10);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-surface"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Хедер */}
            <View
                className="flex-row items-center px-2 bg-surface border-b border-surfaceLight"
                style={{ paddingTop: insets.top + 8, paddingBottom: 10 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    className="w-10 h-10 items-center justify-center"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/settings/${chatRoomId}`)}
                    className="flex-1 flex-row items-center ml-1"
                >
                    <Avatar id={chatRoomId} name={room?.title} size={40} squircle />

                    <View className="flex-1 ml-3 mr-2">
                        <Text className="text-white text-[16px] font-semibold" numberOfLines={1}>
                            {room?.title ?? "Чат"}
                        </Text>
                        <Text className="text-textMuted text-[12px] mt-0.5" numberOfLines={1}>
                            {room?.description || "натисніть для інформації"}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push(`/settings/${chatRoomId}`)}
                    activeOpacity={0.7}
                    className="w-10 h-10 items-center justify-center"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="information-circle-outline" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Повідомлення */}
            {messages === undefined || currentUser === undefined || room === undefined ? (
                <View className="flex-1 justify-center items-center bg-background">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-textMuted text-sm mt-3">Завантаження...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    className="flex-1 bg-background"
                    data={messages}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingTop: 10,
                        paddingBottom: 8,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center px-10 py-20">
                            <View className="w-16 h-16 rounded-full bg-surfaceLight items-center justify-center mb-4">
                                <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.textMuted} />
                            </View>
                            <Text className="text-white text-base font-semibold text-center mb-1">
                                Повідомлень ще немає
                            </Text>
                            <Text className="text-textMuted text-sm text-center leading-5">
                                Напишіть перше повідомлення
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <SwipeableMessageItem
                            item={item as MessageItemData}
                            isOwn={item.senderId === currentUser?._id}
                            onLongPress={() => handleMessageLongPress(item as MessageItemData)}
                            onReply={handleStartReply}
                            onImagePress={(url) => setFullscreenImage(url)}
                            onAuthorPress={(authorId) =>
                                router.push({ pathname: "/user/[id]", params: { id: String(authorId) } })
                            }
                        />
                    )}
                />
            )}

            {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

            {/* Нижняя зона */}
            <View className="bg-surface border-t border-surfaceLight">
                {replyTarget && (
                    <ReplyPreviewBar replyTarget={replyTarget} onCancel={() => setReplyTarget(null)} />
                )}

                {editingMessageId && (
                    <View className="flex-row items-center mx-3 mt-2 px-3 py-2 rounded-xl bg-surfaceLight">
                        <View className="w-1 h-8 rounded-full bg-primary mr-3" />
                        <Ionicons name="pencil" size={15} color={COLORS.primary} />
                        <View className="flex-1 ml-2">
                            <Text className="text-primary text-[12px] font-semibold">Редагування</Text>
                            <Text className="text-textMuted text-[11px]">Змініть текст і натисніть ✓</Text>
                        </View>
                        <TouchableOpacity onPress={cancelEditing} hitSlop={12}>
                            <Ionicons name="close" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                )}

                {selectedImage && (
                    <View className="mx-3 mt-2 flex-row">
                        <View>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={{ width: 72, height: 72, borderRadius: 12 }}
                            />
                            <TouchableOpacity
                                onPress={() => setSelectedImage(null)}
                                hitSlop={8}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-surface items-center justify-center border border-surfaceLight"
                            >
                                <Ionicons name="close" size={14} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View className="flex-row items-end px-2 pt-2" style={{ paddingBottom: bottomPadding }}>
                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={isSubmitting || !!editingMessageId}
                        activeOpacity={0.7}
                        className={`w-10 h-10 mb-0.5 items-center justify-center ${editingMessageId ? "opacity-40" : ""
                            }`}
                    >
                        <Ionicons name="attach" size={26} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <View className="flex-1 mx-1 bg-background rounded-[22px] border border-surfaceLight px-3.5 py-1 min-h-[42px] justify-center">
                        <TextInput
                            className="text-white text-[16px] leading-[22px]"
                            style={{
                                maxHeight: 120,
                                paddingTop: Platform.OS === "ios" ? 9 : 6,
                                paddingBottom: Platform.OS === "ios" ? 9 : 6,
                                textAlignVertical: "center",
                            }}
                            placeholder={
                                editingMessageId
                                    ? "Змініть текст..."
                                    : replyTarget
                                        ? `Відповідь ${replyTarget.senderName}...`
                                        : selectedImage
                                            ? "Підпис до фото..."
                                            : "Повідомлення"
                            }
                            placeholderTextColor={COLORS.textMuted}
                            value={inputText}
                            onChangeText={handleTextChange}
                            multiline
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={sendDisabled}
                        activeOpacity={0.75}
                        className={`w-10 h-10 mb-0.5 rounded-full items-center justify-center ${sendDisabled ? "bg-surfaceLight" : "bg-primary"
                            }`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons
                                name={editingMessageId ? "checkmark" : "arrow-up"}
                                size={22}
                                color={sendDisabled ? COLORS.textMuted : "#FFFFFF"}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ImageViewerModal
                visible={!!fullscreenImage}
                imageUrl={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />
        </KeyboardAvoidingView>
    );
}