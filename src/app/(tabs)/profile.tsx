import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { TAB_BAR_SPACE } from "@/constants/layout";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProfileHero, StatCard } from "@/components/ProfileParts";

export default function ProfileScreen() {
    const currentUser = useQuery(api.users.currentUser);
    const { signOut } = useAuthActions();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const profileDetails = useQuery(
        api.users.getUserProfile,
        currentUser?._id ? { userId: currentUser._id } : "skip"
    );

    const handleSignOut = () => {
        Alert.alert("Вихід з акаунта", "Ви дійсно бажаєте вийти з Modern Chat?", [
            { text: "Скасувати", style: "cancel" },
            {
                text: "Вийти",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Помилка", "Не вдалося вийти з акаунта");
                    }
                },
            },
        ]);
    };

    if (!currentUser || profileDetails === undefined) {
        return (
            <View className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}
            >
                <ProfileHero
                    id={currentUser._id}
                    name={currentUser.name ?? "Користувач"}
                    username={currentUser.username}
                    email={currentUser.email}
                    bio={currentUser.bio}
                    image={currentUser.image}
                />

                <View className="flex-row gap-3 mb-4">
                    <StatCard
                        icon="chatbubble-ellipses"
                        color={COLORS.primary}
                        value={profileDetails?.stats.messagesCount ?? 0}
                        label="Повідомлень"
                    />
                    <StatCard
                        icon="folder"
                        color="#A855F7"
                        value={profileDetails?.stats.roomsCreatedCount ?? 0}
                        label="Створено кімнат"
                    />
                </View>

                <View className="gap-3">
                    <TouchableOpacity
                        onPress={() => setIsEditModalOpen(true)}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-center bg-primary rounded-2xl py-3.5 px-4"
                    >
                        <Ionicons name="create-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Редагувати профіль</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-center rounded-2xl py-3.5 px-4"
                        style={{
                            backgroundColor: "rgba(239,68,68,0.1)",
                            borderWidth: 1,
                            borderColor: "rgba(239,68,68,0.3)",
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                        <Text style={{ color: COLORS.danger }} className="font-bold text-base">
                            Вийти з акаунта
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <EditProfileModal
                visible={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentUser={currentUser}
            />
        </View>
    );
}