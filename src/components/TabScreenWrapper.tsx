import { View, Platform } from "react-native";

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM = Platform.OS === "ios" ? 30 : 16;

export function TabScreenWrapper({ children }: { children: React.ReactNode }) {

    return (
        <View
            className="flex-1 bg-surface"
            style={{
                paddingBottom: TAB_BAR_HEIGHT + TAB_BAR_BOTTOM + 12
            }}
        >
            {children}
        </View>
    );
}