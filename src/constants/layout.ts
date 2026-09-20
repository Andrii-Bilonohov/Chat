import { Platform } from "react-native";

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM = Platform.OS === "ios" ? 30 : 16;

export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM + 16;