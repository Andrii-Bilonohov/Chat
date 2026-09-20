import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export interface ReplyTarget {
    messageId: string;
    senderName: string;
    text: string;
}

interface ReplyPreviewBarProps {
    replyTarget: ReplyTarget;
    onCancel: () => void;
}

export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({ replyTarget, onCancel }) => {
    return (
        <View className="flex-row items-center mx-3 mt-2 px-3 py-2 rounded-xl bg-surfaceLight">
            <View className="w-1 h-8 rounded-full bg-primary mr-3" />
            <Ionicons name="arrow-undo" size={16} color={COLORS.primary} />
            <View className="flex-1 ml-2">
                <Text className="text-primary text-[12px] font-semibold" numberOfLines={1}>
                    Відповідь {replyTarget.senderName}
                </Text>
                <Text className="text-white/80 text-[12px] mt-0.5" numberOfLines={1}>
                    {replyTarget.text || "📷 Зображення"}
                </Text>
            </View>
            <TouchableOpacity onPress={onCancel} hitSlop={12}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
        </View>
    );
};