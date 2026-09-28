import { Avatar, colorForId } from "@/components/Avatar";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { useState } from "react";
import { ReactionPickerModal } from "./ReactionPickerModal";
import { ReactionBadges } from "./ReactionBadges";
import { VideoNotePlayer } from "./VideoNotePlayer";

export interface MessageItemData {
    _id: Id<"messages">;
    senderId: Id<"users">;
    senderName: string;
    senderPhoto?: string;
    content?: string;
    imageUrl?: string;
    isEdited?: boolean;
    replyToId?: Id<"messages">;
    replyToSender?: string;
    replyToText?: string;
    _creationTime: number;
    audioUrl?: string;
    audioDuration?: number;
    videoUrl?: string;
    videoDuration?: number;
    isVideoNote?: boolean;
}

interface SwipeableMessageItemProps {
    item: MessageItemData;
    isOwn: boolean;
    showAvatar?: boolean;
    onLongPress: () => void;
    onReply: (message: MessageItemData) => void;
    onImagePress?: (url: string) => void;
    onAuthorPress?: (userId: Id<"users">) => void;
}

const SWIPE_THRESHOLD = 52;

export const SwipeableMessageItem: React.FC<SwipeableMessageItemProps> = ({
    item,
    isOwn,
    showAvatar = true,
    onLongPress,
    onReply,
    onImagePress,
    onAuthorPress,
}) => {
    const translateX = useSharedValue(0);

    const triggerReply = () => onReply(item);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-20, 20])
        .onUpdate((e) => {
            if (e.translationX > 0) {
                translateX.value = Math.min(e.translationX * 0.85, 68);
            }
        })
        .onEnd((e) => {
            if (e.translationX > SWIPE_THRESHOLD) {
                runOnJS(triggerReply)();
            }
            translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        });

    const bubbleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const replyIconStyle = useAnimatedStyle(() => {
        const p = Math.min(translateX.value / SWIPE_THRESHOLD, 1);
        return {
            opacity: p,
            transform: [{ scale: 0.4 + p * 0.6 }],
        };
    });

    const time = new Date(item._creationTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const metaLabel = (item.isEdited ? "ред. " : "") + time;

    const hasText = !!item.content?.trim();
    const hasImage = !!item.imageUrl;
    const hasReply = !!item.replyToSender;
    const hasAudio = !!item.audioUrl;
    const imageOnly = hasImage && !hasText && !hasAudio;
    const audioUrl = item.audioUrl;
    const audioDuration = item.audioDuration ?? 0;

    const nameColor = colorForId(item.senderId);

    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    const handleSelectEmoji = async (emoji: string) => {
        try {
            await toggleReaction({ messageId: item._id, emoji });
        } catch (error) {
            console.error("Помилка реакції:", error);
        }
    };


    const handleLongPress = () => setShowReactionPicker(true);

    const handleMoreActions = () => {
        setShowReactionPicker(false);
        onLongPress();
    };

    return (
        <View className="mb-1.5">
            <Animated.View
                pointerEvents="none"
                style={[{ position: "absolute", left: 4, top: 0, bottom: 0, justifyContent: "center" }, replyIconStyle]}
            >
                <View className="w-[30px] h-[30px] rounded-full bg-primary/20 items-center justify-center">
                    <Ionicons name="arrow-undo" size={16} color={COLORS.primary} />
                </View>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.View
                    className={`flex-row items-end ${isOwn ? "justify-end" : "justify-start"}`}
                    style={bubbleStyle}
                >
                    {!isOwn && showAvatar && (
                        <TouchableOpacity
                            onPress={() => onAuthorPress?.(item.senderId)}
                            activeOpacity={0.7}
                            className="mr-1.5 mb-0.5"
                        >
                            <Avatar id={item.senderId} name={item.senderName} uri={item.senderPhoto} size={30} />
                        </TouchableOpacity>
                    )}

                    {!isOwn && !showAvatar && <View className="w-9" />}

                    <View className={`max-w-[78%] shrink ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && (
                            <Text
                                style={{ color: nameColor }}
                                className="text-[13px] font-bold mb-0.5 ml-0.5"
                                numberOfLines={1}
                            >
                                {item.senderName}
                            </Text>
                        )}

                        {item.videoUrl && item.isVideoNote ? (
                            <View className="my-1 items-center justify-center p-1">
                                <VideoNotePlayer
                                    videoUrl={item.videoUrl}
                                    duration={item.videoDuration}
                                    size={210}
                                />
                            </View>
                        ) : (
                            <View className={`items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                            <Pressable
                                onLongPress={handleLongPress}
                                delayLongPress={250}
                                className={`overflow-hidden rounded-2xl ${isOwn
                                    ? "bg-primary rounded-br-md"
                                    : "bg-secondary border border-surfaceLight/60 rounded-bl-md"
                                    } ${imageOnly
                                        ? "p-1"
                                        : hasReply || hasImage
                                            ? "px-2.5 pt-1.5 pb-2"
                                            : "px-2.5 py-2"
                                    }`}
                                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                            >
                                {hasReply && (
                                    <View
                                        className={`mb-1.5 pl-2 pr-2 py-1.5 rounded-lg border-l-[3px] ${isOwn
                                            ? "border-l-white/85 bg-black/20"
                                            : "border-l-primary bg-primary/10"
                                            }`}
                                    >
                                        <Text
                                            className={`text-[12px] font-bold ${isOwn ? "text-white" : "text-[#60A5FA]"
                                                }`}
                                            numberOfLines={1}
                                        >
                                            {item.replyToSender}
                                        </Text>
                                        <Text
                                            className={`text-[12.5px] mt-0.5 leading-4 ${isOwn ? "text-white/85" : "text-[#CBD5E1]"
                                                }`}
                                            numberOfLines={2}
                                        >
                                            {item.replyToText || "📷 Фотографія"}
                                        </Text>
                                    </View>
                                )}

                                {hasImage && (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => onImagePress?.(item.imageUrl!)}
                                        onLongPress={handleLongPress}
                                        delayLongPress={250}
                                        className={hasText || hasAudio ? "mb-1.5" : ""}
                                    >
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            className={`w-[236px] h-[236px] bg-black/25 ${imageOnly ? "rounded-2xl" : "rounded-xl"
                                                }`}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}

                                {hasAudio && (
                                    <View className="my-0.5">
                                        <VoiceMessagePlayer
                                            audioUrl={audioUrl!}
                                            duration={audioDuration}
                                            isMyMessage={isOwn}
                                        />
                                    </View>
                                )}

                                {hasText && (
                                    <Text className="text-white text-[15.5px] leading-[21px] tracking-[0.1px]">
                                        {item.content}
                                    </Text>
                                )}
                            </Pressable>

                            <Text className="text-[11px] mx-1.5 mb-0.5 text-[rgba(148,163,184,0.9)]">
                                {metaLabel}
                            </Text>
                        </View>
                        )}
                        
                    </View>
                </Animated.View>
            </GestureDetector>

            <ReactionBadges messageId={item._id} />

            <ReactionPickerModal
                visible={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelectEmoji={handleSelectEmoji}
                onMoreActions={handleMoreActions}
            />
        </View>
    );
};