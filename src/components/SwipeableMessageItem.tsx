import React from "react";
import { View, Text, Pressable, TouchableOpacity, Image } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, colorForId } from "@/components/Avatar";

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
}

interface SwipeableMessageItemProps {
    item: MessageItemData;
    isOwn: boolean;
    onLongPress: () => void;
    onReply: (message: MessageItemData) => void;
    onImagePress?: (url: string) => void;
    onAuthorPress?: (userId: Id<"users">) => void;
}

const SWIPE_THRESHOLD = 52;

export const SwipeableMessageItem: React.FC<SwipeableMessageItemProps> = ({
    item,
    isOwn,
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
    const imageOnly = hasImage && !hasText;

    const nameColor = colorForId(item.senderId);
    const metaColor = isOwn ? "rgba(255,255,255,0.7)" : COLORS.textMuted;

    return (
        <View style={{ marginBottom: 6 }}>
            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        left: 4,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                    },
                    replyIconStyle,
                ]}
            >
                <View
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: "rgba(59,130,246,0.2)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="arrow-undo" size={16} color={COLORS.primary} />
                </View>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        {
                            flexDirection: "row",
                            alignItems: "flex-end",
                            justifyContent: isOwn ? "flex-end" : "flex-start",
                        },
                        bubbleStyle,
                    ]}
                >
                    {!isOwn && (
                        <TouchableOpacity
                            onPress={() => onAuthorPress?.(item.senderId)}
                            activeOpacity={0.7}
                            style={{ marginRight: 6 }}
                        >
                            <Avatar
                                id={item.senderId}
                                name={item.senderName}
                                uri={item.senderPhoto}
                                size={30}
                            />
                        </TouchableOpacity>
                    )}

                    <Pressable
                        onLongPress={onLongPress}
                        delayLongPress={250}
                        style={({ pressed }) => ({
                            maxWidth: "78%",
                            flexShrink: 1,
                            borderRadius: 18,
                            borderBottomRightRadius: isOwn ? 5 : 18,
                            borderBottomLeftRadius: isOwn ? 18 : 5,
                            backgroundColor: isOwn ? COLORS.primary : COLORS.secondary,
                            borderWidth: isOwn ? 0 : 1,
                            borderColor: "rgba(51,65,85,0.6)",
                            paddingHorizontal: imageOnly ? 4 : 11,
                            paddingTop: imageOnly ? 4 : hasReply || hasImage ? 7 : 8,
                            paddingBottom: imageOnly ? 4 : 6,
                            overflow: "hidden",
                            opacity: pressed ? 0.92 : 1,
                        })}
                    >
                        {!isOwn && (
                            <Text
                                style={{
                                    color: nameColor,
                                    fontSize: 13,
                                    fontWeight: "700",
                                    marginBottom: 3,
                                    marginLeft: imageOnly ? 7 : 0,
                                    marginTop: imageOnly ? 3 : 0,
                                }}
                                numberOfLines={1}
                            >
                                {item.senderName}
                            </Text>
                        )}

                        {hasReply && (
                            <View
                                style={{
                                    marginBottom: 6,
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                    paddingVertical: 5,
                                    borderRadius: 8,
                                    borderLeftWidth: 3,
                                    borderLeftColor: isOwn ? "rgba(255,255,255,0.85)" : COLORS.primary,
                                    backgroundColor: isOwn ? "rgba(0,0,0,0.18)" : "rgba(59,130,246,0.12)",
                                }}
                            >
                                <Text
                                    style={{
                                        color: isOwn ? "#FFFFFF" : "#60A5FA",
                                        fontSize: 12,
                                        fontWeight: "700",
                                    }}
                                    numberOfLines={1}
                                >
                                    {item.replyToSender}
                                </Text>
                                <Text
                                    style={{
                                        color: isOwn ? "rgba(255,255,255,0.85)" : "#CBD5E1",
                                        fontSize: 12.5,
                                        marginTop: 1,
                                        lineHeight: 16,
                                    }}
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
                                onLongPress={onLongPress}
                                delayLongPress={250}
                                style={{ marginBottom: hasText ? 6 : 0 }}
                            >
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={{
                                        width: 236,
                                        height: 236,
                                        borderRadius: imageOnly ? 15 : 12,
                                        backgroundColor: "rgba(0,0,0,0.25)",
                                    }}
                                    resizeMode="cover"
                                />
                                {imageOnly && (
                                    <View
                                        style={{
                                            position: "absolute",
                                            right: 8,
                                            bottom: 8,
                                            paddingHorizontal: 7,
                                            paddingVertical: 2,
                                            borderRadius: 10,
                                            backgroundColor: "rgba(0,0,0,0.5)",
                                        }}
                                    >
                                        <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{metaLabel}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {hasText && (
                            <View>
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 15.5,
                                        lineHeight: 21,
                                        letterSpacing: 0.1,
                                    }}
                                >
                                    {item.content}
                                    <Text style={{ color: "transparent", fontSize: 11 }}>
                                        {"\u00A0\u00A0\u00A0" + metaLabel}
                                    </Text>
                                </Text>

                                <Text
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        bottom: 1,
                                        color: metaColor,
                                        fontSize: 11,
                                    }}
                                >
                                    {metaLabel}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};