import React from "react";
import { View } from "react-native";
import { TAB_BAR_SPACE } from "@/constants/layout";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export function TabScreenWrapper({ children }: { children: React.ReactNode }) {
    const keyboardVisible = useKeyboardVisible();

    return (
        <View
            className="flex-1 bg-surface"
            style={{ paddingBottom: keyboardVisible ? 0 : TAB_BAR_SPACE }}
        >
            {children}
        </View>
    );
}