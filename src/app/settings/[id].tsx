import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import { Avatar } from "@/components/Avatar";

export default function RoomSettingsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const roomId = id as Id<"chatRooms">;

    const room = useQuery(api.rooms.getRoom, { roomId });
    const currentUser = useQuery(api.users.currentUser);
    const deleteRoom = useMutation(api.rooms.deleteRoom);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCreator = !!room && !!currentUser && room.creatorId === currentUser._id;

    const goHome = () => {
        if (router.canDismiss()) router.dismissAll();
        else router.replace("/(tabs)");
    };

    const handleDelete = () => {
        Alert.alert(
            "Видалення кімнати",
            "Ви впевнені, що хочете видалити цю кімнату та всі її повідомлення?",
            [
                { text: "Скасувати", style: "cancel" },
                {
                    text: "Видалити",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteRoom({ roomId });
                            goHome();
                        } catch (err) {
                            console.error(err);
                            setIsDeleting(false);
                            Alert.alert("Помилка", "Не вдалося видалити кімнату.");
                        }
                    },
                },
            ]
        );
    };

    if (room === undefined || currentUser === undefined) {
        return (
            <View className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (room === null) {
        return (
            <View className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center px-8">
                    <Ionicons name="alert-circle-outline" size={44} color={COLORS.textMuted} />
                    <Text className="text-white text-lg font-bold mt-3">Кімнату не знайдено</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">

            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <View className="bg-secondary border border-surfaceLight rounded-3xl p-5 items-center mb-4">
                    <Avatar id={room._id} name={room.title} size={80} squircle />
                    <Text className="text-white text-2xl font-bold mt-4 text-center">{room.title}</Text>
                    {isCreator && (
                        <View className="bg-primary/20 px-2.5 py-1 rounded-full mt-2">
                            <Text className="text-primary text-xs font-semibold">Ви автор кімнати</Text>
                        </View>
                    )}
                </View>

                {room.description ? (
                    <View className="bg-secondary border border-surfaceLight rounded-2xl p-4 mb-4">
                        <Text className="text-textMuted text-[10px] font-semibold uppercase mb-1">Опис</Text>
                        <Text className="text-white text-sm leading-5">{room.description}</Text>
                    </View>
                ) : null}

                <View className="bg-secondary/60 border border-surfaceLight rounded-2xl p-4 flex-row items-center mb-6">
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={COLORS.textMuted}
                        style={{ marginRight: 10 }}
                    />
                    <Text className="text-textMuted text-xs">
                        Створено {new Date(room._creationTime).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </Text>
                </View>

                {isCreator ? (
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={isDeleting}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-center rounded-2xl py-4"
                        style={{
                            backgroundColor: "rgba(239,68,68,0.12)",
                            borderWidth: 1,
                            borderColor: "rgba(239,68,68,0.3)",
                            opacity: isDeleting ? 0.6 : 1,
                        }}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={COLORS.danger} />
                        ) : (
                            <>
                                <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color={COLORS.danger}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={{ color: COLORS.danger }} className="text-base font-bold">
                                    Видалити кімнату
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <Text className="text-textMuted text-xs text-center">
                        Лише автор може видалити кімнату
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}