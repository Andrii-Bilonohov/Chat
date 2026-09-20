import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import { TAB_BAR_SPACE } from "@/constants/layout";
import { SwipeableRoomItem } from "@/components/SwipeableRoomItem";

export default function HomeScreen() {
  const router = useRouter();
  const rooms = useQuery(api.rooms.listRooms);
  const currentUser = useQuery(api.users.currentUser);
  const deleteRoom = useMutation(api.rooms.deleteRoom);

  const [search, setSearch] = useState("");

  const visibleRooms = useMemo(() => {
    if (!rooms) return [];
    const q = search.trim().toLowerCase();
    return rooms
      .filter((r) => !q || r.title.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          (b.lastMessageAt ?? b._creationTime) - (a.lastMessageAt ?? a._creationTime)
      );
  }, [rooms, search]);

  const handleDeleteRoom = (roomId: Id<"chatRooms">) => {
    const room = rooms?.find((r) => r._id === roomId);
    if (!room) return;

    if (room.creatorId !== currentUser?._id) {
      Alert.alert("Обмеження доступу", "Лише автор кімнати може її видалити.");
      return;
    }

    Alert.alert(
      "Видалити кімнату?",
      `Кімната «${room.title}» та всі її повідомлення будуть видалені. Цю дію неможливо скасувати.`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoom({ roomId });
            } catch (error) {
              console.error(error);
              Alert.alert("Помилка", "Не вдалося видалити кімнату");
            }
          },
        },
      ]
    );
  };

  const isLoading = rooms === undefined || currentUser === undefined;

  return (
    <View className="flex-1 bg-surface">

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-textMuted text-sm mt-4">Завантаження кімнат...</Text>
        </View>
      ) : rooms.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8" style={{ paddingBottom: TAB_BAR_SPACE }}>
          <View className="w-20 h-20 rounded-3xl bg-secondary border border-surfaceLight items-center justify-center mb-5">
            <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
          </View>
          <Text className="text-white text-xl font-bold text-center mb-2">
            Немає активних кімнат
          </Text>
          <Text className="text-textMuted text-sm text-center leading-5 mb-6">
            Створіть першу кімнату та запросіть співрозмовників
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/new-room")}
            activeOpacity={0.85}
            className="flex-row items-center bg-primary px-5 py-3 rounded-full"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-1.5">Створити кімнату</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleRooms}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: TAB_BAR_SPACE,
          }}
          ListHeaderComponent={
            <View className="flex-row items-center bg-secondary border border-surfaceLight rounded-2xl px-3 mb-4">
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Пошук кімнат"
                placeholderTextColor={COLORS.textMuted}
                className="flex-1 text-white text-base px-2 py-3"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="search-outline" size={32} color={COLORS.textMuted} />
              <Text className="text-textMuted text-sm mt-3">Нічого не знайдено</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeableRoomItem
              room={item}
              isCreator={item.creatorId === currentUser?._id}
              onPress={() => router.push(`/chat/${item._id}`)}
              onDelete={handleDeleteRoom}
            />
          )}
        />
      )}
    </View>
  );
}