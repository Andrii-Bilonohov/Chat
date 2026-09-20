import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Avatar, colorForId } from "@/components/Avatar";

type HeroProps = {
    id: string;
    name: string;
    username?: string;
    email?: string;
    bio?: string;
    image?: string | null;
    badge?: string;
};

export function ProfileHero({ id, name, username, email, bio, image, badge }: HeroProps) {
    const color = colorForId(id);

    return (
        <View className="bg-secondary border border-surfaceLight rounded-3xl overflow-hidden mb-4">
            <View style={{ height: 96, backgroundColor: color + "40" }} />

            <View className="items-center px-5 pb-5" style={{ marginTop: -48 }}>
                <View
                    style={{
                        borderWidth: 4,
                        borderColor: COLORS.secondary,
                        borderRadius: 52,
                    }}
                >
                    <Avatar id={id} name={name} uri={image} size={92} />
                </View>

                <Text className="text-white text-2xl font-bold mt-3 text-center">{name}</Text>

                {username ? (
                    <Text className="text-primary text-sm font-semibold mt-0.5">@{username}</Text>
                ) : null}

                {email ? <Text className="text-textMuted text-xs mt-1">{email}</Text> : null}

                {badge ? (
                    <View className="bg-primary/20 px-2.5 py-1 rounded-full mt-3">
                        <Text className="text-primary text-xs font-semibold">{badge}</Text>
                    </View>
                ) : null}

                {bio ? (
                    <View className="mt-4 w-full px-4 py-3 bg-background rounded-2xl border border-surfaceLight">
                        <Text className="text-textMuted text-[10px] font-semibold uppercase mb-1">
                            Про себе
                        </Text>
                        <Text className="text-white text-sm leading-5">{bio}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

type StatProps = {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    value: number;
    label: string;
};

export function StatCard({ icon, color, value, label }: StatProps) {
    return (
        <View className="flex-1 bg-secondary border border-surfaceLight rounded-2xl p-4 items-center">
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color + "26",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-white text-xl font-bold">{value}</Text>
            <Text className="text-textMuted text-xs mt-0.5">{label}</Text>
        </View>
    );
}