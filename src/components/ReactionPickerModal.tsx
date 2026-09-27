import React from "react";
import { Text, TouchableOpacity, Modal, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

const POPULAR_EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "😢"];

interface ReactionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onMoreActions?: () => void;
}

export const ReactionPickerModal: React.FC<ReactionPickerModalProps> = ({
  visible,
  onClose,
  onSelectEmoji,
  onMoreActions,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <View className="items-center gap-2">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-surface border border-surfaceLight rounded-3xl p-3 flex-row items-center gap-2 shadow-2xl"
          >
            {POPULAR_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="w-12 h-12 rounded-2xl bg-surfaceLight/80 items-center justify-center active:scale-125"
                activeOpacity={0.7}
              >
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}

            {onMoreActions && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onMoreActions();
                }}
                className="w-12 h-12 rounded-2xl bg-surfaceLight/80 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};