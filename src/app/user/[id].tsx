import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import { ProfileHero, StatCard } from "@/components/ProfileParts";

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const userId = id as Id<"users">;
    const userProfile = useQuery(api.users.getUserProfile, { userId });
    const currentUser = useQuery(api.users.currentUser);

    const isOwnProfile = currentUser?._id === userId;

    if (userProfile === undefined) {
        return (
            <View className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (userProfile === null) {
        return (
            <View className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center p-6">
                    <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                    <Text className="text-white text-lg font-bold mt-3">Користувача не знайдено</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4 bg-secondary px-5 py-2.5 rounded-xl border border-surfaceLight"
                    >
                        <Text className="text-white font-medium">Повернутися</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                <ProfileHero
                    id={userProfile._id}
                    name={userProfile.name}
                    username={userProfile.username}
                    bio={userProfile.bio}
                    image={userProfile.image}
                    badge={isOwnProfile ? "Це ваш акаунт" : undefined}
                />

                <View className="flex-row gap-3 mb-4">
                    <StatCard
                        icon="chatbubble-ellipses"
                        color={COLORS.primary}
                        value={userProfile.stats.messagesCount}
                        label="Повідомлень"
                    />
                    <StatCard
                        icon="folder"
                        color="#A855F7"
                        value={userProfile.stats.roomsCreatedCount}
                        label="Створено кімнат"
                    />
                </View>

                <View className="bg-secondary/60 border border-surfaceLight rounded-2xl p-4 flex-row items-center">
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={COLORS.textMuted}
                        style={{ marginRight: 10 }}
                    />
                    <Text className="text-textMuted text-xs">
                        Учасник з {new Date(userProfile._creationTime).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}