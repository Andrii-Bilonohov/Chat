import { useState, useRef } from "react";
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
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import {
    useAudioRecorder,
    useAudioRecorderState,
    RecordingPresets,
    requestRecordingPermissionsAsync,
} from "expo-audio";
import { COLORS } from "@/constants/theme";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { Avatar } from "@/components/Avatar";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";
import { SwipeableMessageItem, MessageItemData } from "@/components/SwipeableMessageItem";
import { ReplyPreviewBar, ReplyTarget } from "@/components/ReplyPreviewBar";
import { VideoNoteRecorder } from "@/components/VideoNoteRecorder";

type SelectedImage = { uri: string; mimeType: string };

const MESSAGES_PAGE_SIZE = 25;

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const keyboardVisible = useKeyboardVisible();

    const chatRoomId = id as Id<"chatRooms">;
    const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
    const currentUser = useQuery(api.users.currentUser);
    const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

    const {
        results: messages,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.messages.getPaginatedMessages,
        { chatRoomId },
        { initialNumItems: MESSAGES_PAGE_SIZE }
    );

    const sendMessage = useMutation(api.messages.sendMessage);
    const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
    const sendAudioMessage = useMutation(api.messages.sendAudioMessage);
    const sendVideoNote = useMutation(api.messages.sendVideoNoteMessage);
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
    const [isVideoRecorderVisible, setIsVideoRecorderVisible] = useState(false);

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);
    const recordingSeconds = Math.floor((recorderState.durationMillis || 0) / 1000);

    const lastTypingCallRef = useRef<number>(0);
    const flatListRef = useRef<FlatList>(null);

    // Список inverted: index 0 = найновіше повідомлення, старіші підвантажуються вгору
    const handleLoadMore = () => {
        if (status === "CanLoadMore") {
            loadMore(MESSAGES_PAGE_SIZE);
        }
    };

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
            const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permStatus !== "granted") {
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
            text:
                msg.content ||
                (msg.imageUrl ? "📷 Фотографія" : msg.videoUrl ? "🎥 Відео" : msg.audioUrl ? "🎤 Голосове" : ""),
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

    const startRecording = async () => {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                "Дозвіл не надано",
                "Для запису голосових повідомлень потрібен доступ до мікрофона."
            );
            return;
        }

        try {
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
        } catch (error) {
            console.error("Помилка початку запису:", error);
            Alert.alert("Помилка", "Не вдалося розпочати запис аудіо.");
        }
    };

    const cancelRecording = async () => {
        try {
            await audioRecorder.stop();
        } catch (error) {
            console.error("Помилка скасування запису:", error);
        }
    };

    const stopAndSendRecording = async () => {
        try {
            const durationSeconds = Math.round((recorderState.durationMillis || 0) / 1000);
            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            if (!uri || durationSeconds < 1) {
                Alert.alert("Занадто коротке", "Голосове повідомлення занадто коротке.");
                return;
            }

            setIsSubmitting(true);

            const uploadUrl = await generateUploadUrl();
            const file = new File(uri);

            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": "audio/m4a" },
                body: file,
            });

            if (!uploadResult.ok) throw new Error("Не вдалося завантажити аудіо");
            const { storageId } = await uploadResult.json();

            await sendAudioMessage({
                chatRoomId,
                audioStorageId: storageId,
                audioDuration: durationSeconds,
                replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
                replyToSender: replyTarget?.senderName,
                replyToText: replyTarget?.text,
            });

            setReplyTarget(null);
        } catch (error) {
            console.error("Помилка завантаження аудіо:", error);
            Alert.alert("Помилка", "Не вдалося надіслати голосове повідомлення.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendVideoNote = async (videoUri: string, duration: number) => {
        try {
            setIsSubmitting(true);

            const uploadUrl = await generateUploadUrl();
            const file = new File(videoUri);

            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "Content-Type": videoUri.toLowerCase().endsWith(".mov")
                        ? "video/quicktime"
                        : "video/mp4",
                },
                body: file,
            });

            if (!uploadResult.ok) throw new Error("Не вдалося завантажити відео");
            const { storageId } = await uploadResult.json();

            await sendVideoNote({
                chatRoomId,
                videoStorageId: storageId,
                videoDuration: Math.round(duration),
            });

            setIsVideoRecorderVisible(false);
        } catch (error) {
            console.error("Помилка надсилання відеокружечка:", error);
            Alert.alert("Помилка", "Не вдалося надіслати відеоповідомлення");
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

    // Усі хуки — вище цього return
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

    const isRecording = recorderState.isRecording;
    const showMicButton =
        !isRecording && !editingMessageId && !selectedImage && !inputText.trim() && !isSubmitting;
    const sendDisabled = (!inputText.trim() && !selectedImage) || isSubmitting;
    const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 10);
    const isInitialLoading =
        status === "LoadingFirstPage" || currentUser === undefined || room === undefined;

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View
                className="flex-row items-center bg-surface px-2 border-b border-surfaceLight"
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

            {isInitialLoading ? (
                <View className="flex-1 justify-center items-center bg-background">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-textMuted text-sm mt-3">Завантаження...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    className="flex-1 bg-background"
                    data={messages}
                    inverted
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingTop: 8,
                        paddingBottom: 10,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        status === "LoadingMore" ? (
                            <View className="py-4 items-center w-full">
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View
                            className="flex-1 items-center justify-center px-10 py-20"
                            style={{ transform: [{ scaleY: -1 }] }}
                        >
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
                    renderItem={({ item, index }) => {
                        const isOwn = item.senderId === currentUser?._id;

                        const newer = index > 0 ? messages[index - 1] : null;
                        const showAvatar = !isOwn && (!newer || newer.senderId !== item.senderId);

                        return (
                            <SwipeableMessageItem
                                item={item as MessageItemData}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                                onLongPress={() => handleMessageLongPress(item as MessageItemData)}
                                onReply={handleStartReply}
                                onImagePress={(url) => setFullscreenImage(url)}
                                onAuthorPress={(authorId) =>
                                    router.push({
                                        pathname: "/user/[id]",
                                        params: { id: String(authorId) },
                                    })
                                }
                            />
                        );
                    }}
                />
            )}

            {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

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

                {isRecording ? (
                    <View className="flex-row items-center justify-between mx-3 my-2 bg-surfaceLight/60 px-4 py-2.5 rounded-2xl">
                        <View className="flex-row items-center gap-3">
                            <View className="w-3 h-3 rounded-full bg-red-500" />
                            <Text className="text-white font-medium">Запис: {recordingSeconds} с</Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity onPress={cancelRecording} className="p-2 active:opacity-70">
                                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={stopAndSendRecording}
                                disabled={isSubmitting}
                                className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View className="flex-row items-end px-2 pt-2" style={{ paddingBottom: bottomPadding }}>
                        <TouchableOpacity
                            onPress={pickImage}
                            disabled={isSubmitting || !!editingMessageId}
                            activeOpacity={0.7}
                            className={`w-10 h-10 mb-0.5 items-center justify-center ${
                                editingMessageId ? "opacity-40" : ""
                            }`}
                        >
                            <Ionicons name="attach" size={26} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <View className="flex-1 mx-1 bg-surface rounded-[22px] border border-surfaceLight px-3.5 py-1 min-h-[42px] justify-center">
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

                        {showMicButton ? (
                            <TouchableOpacity
                                onPress={startRecording}
                                activeOpacity={0.75}
                                className="w-10 h-10 mb-0.5 rounded-full bg-surfaceLight items-center justify-center"
                            >
                                <Ionicons name="mic" size={22} color={COLORS.primary} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={sendDisabled}
                                activeOpacity={0.75}
                                className={`w-10 h-10 mb-0.5 rounded-full items-center justify-center ${
                                    sendDisabled ? "bg-surfaceLight" : "bg-primary"
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
                        )}

                        <TouchableOpacity
                            onPress={() => setIsVideoRecorderVisible(true)}
                            disabled={isSubmitting || !!editingMessageId}
                            className={`w-10 h-10 mb-0.5 items-center justify-center active:opacity-70 ${
                                editingMessageId ? "opacity-40" : ""
                            }`}
                        >
                            <Ionicons name="videocam-outline" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <VideoNoteRecorder
                visible={isVideoRecorderVisible}
                onClose={() => setIsVideoRecorderVisible(false)}
                onSendVideo={handleSendVideoNote}
            />

            <ImageViewerModal
                visible={!!fullscreenImage}
                imageUrl={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />
        </KeyboardAvoidingView>
    );
}