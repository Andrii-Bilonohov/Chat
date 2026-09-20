import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
import { Avatar } from "@/components/Avatar";

interface RoomData {
    _id: Id<"chatRooms">;
    title: string;
    description?: string;
    creatorId: Id<"users">;
    lastMessage?: string;
    lastMessageAt?: number;
}

interface SwipeableRoomItemProps {
    room: RoomData;
    isCreator: boolean;
    onPress: () => void;
    onDelete: (roomId: Id<"chatRooms">) => void;
}

const ACTION_WIDTH = 84;
const SPRING = { damping: 18, stiffness: 180 };

export const SwipeableRoomItem: React.FC<SwipeableRoomItemProps> = ({
    room,
    isCreator,
    onPress,
    onDelete,
}) => {
    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);
    const isOpen = useRef(false);

    const setOpen = (value: boolean) => {
        isOpen.current = value;
    };

    const close = () => {
        isOpen.current = false;
        translateX.value = withSpring(0, SPRING);
    };

    const handleDeletePress = () => {
        close();
        onDelete(room._id);
    };

    // Свайп доступен только автору
    const panGesture = Gesture.Pan()
        .enabled(isCreator)
        .activeOffsetX([-15, 15])
        .failOffsetY([-25, 25])
        .onBegin(() => {
            startX.value = translateX.value;
        })
        .onUpdate((event) => {
            const next = startX.value + event.translationX;
            translateX.value = next > 0 ? next * 0.1 : Math.max(next, -ACTION_WIDTH - 16);
        })
        .onEnd((event) => {
            const shouldOpen = translateX.value < -ACTION_WIDTH / 2 || event.velocityX < -500;
            translateX.value = withSpring(shouldOpen ? -ACTION_WIDTH : 0, SPRING);
            runOnJS(setOpen)(shouldOpen);
        });

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        opacity: Math.min(Math.max(-translateX.value / 6, 0), 1),
    }));

    const animatedIconStyle = useAnimatedStyle(() => {
        const progress = Math.min(Math.max(-translateX.value / ACTION_WIDTH, 0), 1);
        return {
            opacity: progress,
            transform: [{ scale: 0.6 + 0.4 * progress }],
        };
    });

    return (
        <View className="overflow-hidden rounded-2xl mb-3">
            {isCreator && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: "#DC2626", alignItems: "flex-end" },
                        animatedBackgroundStyle,
                    ]}
                >
                    <TouchableOpacity
                        onPress={handleDeletePress}
                        activeOpacity={0.8}
                        style={{
                            width: ACTION_WIDTH,
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Animated.View style={[{ alignItems: "center" }, animatedIconStyle]}>
                            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                            <Text className="text-white text-[11px] font-bold mt-1">Видалити</Text>
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <GestureDetector gesture={panGesture}>
                <Animated.View style={animatedCardStyle}>
                    <TouchableOpacity
                        onPress={() => (isOpen.current ? close() : onPress())}
                        activeOpacity={0.9}
                        className="bg-secondary border border-surfaceLight rounded-2xl p-3.5 flex-row items-center"
                    >
                        <Avatar id={room._id} name={room.title} size={52} squircle />

                        <View className="flex-1 ml-3.5">
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-white text-base font-bold flex-shrink" numberOfLines={1}>
                                    {room.title}
                                </Text>
                                {isCreator && (
                                    <View className="bg-primary/20 px-1.5 py-0.5 rounded">
                                        <Text className="text-primary text-[10px] font-semibold">автор</Text>
                                    </View>
                                )}
                            </View>

                            {room.lastMessage ? (
                                <Text className="text-textMuted text-[13px] mt-1" numberOfLines={1}>
                                    {room.lastMessage}
                                </Text>
                            ) : (
                                <Text className="text-textMuted text-[13px] italic mt-1" numberOfLines={1}>
                                    { "Повідомлень ще немає"}
                                </Text>
                            )}
                        </View>

                        {room.lastMessageAt ? (
                            <Text className="text-textMuted text-[11px] ml-2 self-start mt-1">
                                {new Date(room.lastMessageAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        ) : null}
                    </TouchableOpacity>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};