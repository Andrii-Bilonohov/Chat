import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform, ColorValue } from "react-native";
import { COLORS } from "@/constants/theme";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: "absolute",
                    bottom: Platform.OS === "ios" ? 30 : 16,
                    left: 20,
                    right: 20,
                    height: 64,
                    borderRadius: 24,
                    backgroundColor: COLORS.secondary,
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: -2,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Чати",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name={focused ? "chatbubbles" : "chatbubbles-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="new-room"
                options={{
                    title: "Нова кімната",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name={focused ? "add-circle" : "add-circle-outline"}
                            color={color}
                            focused={focused}
                            size={30}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Профіль",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon
                            name={focused ? "person" : "person-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

function TabIcon({
    name,
    color,
    focused,
    size = 24,
}: {
    name: keyof typeof Ionicons.glyphMap;
    color: ColorValue;
    focused: boolean;
    size?: number;
}) {
    return (
        <View
            className={`items-center justify-center ${focused ? "bg-primary/15" : ""}`}
            style={{
                width: 42,
                height: 32,
                borderRadius: 14,
            }}
        >
            <Ionicons name={name} size={size} color={color} />
        </View>
    );
}