import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  isMyMessage?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration = 0,
  isMyMessage = false,
}) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const currentTimeSec =
    status.currentTime > 1000 ? status.currentTime / 1000 : status.currentTime || 0;

  const durationSec =
    status.duration > 1000
      ? status.duration / 1000
      : status.duration > 0
        ? status.duration
        : duration;

  const progress = durationSec > 0 ? Math.min(currentTimeSec / durationSec, 1) : 0;
  const isLoaded = status.isLoaded !== false;
  const isBuffering = status.isBuffering;

  const togglePlayPause = () => {
    if (!isLoaded || !audioUrl) return;

    if (status.playing) {
      player.pause();
    } else {
      if (currentTimeSec >= durationSec - 0.25) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: 216,
        paddingVertical: 4,
        paddingHorizontal: 2,
      }}
    >
      <TouchableOpacity
        onPress={togglePlayPause}
        disabled={!audioUrl || !isLoaded}
        activeOpacity={0.75}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
          backgroundColor: isMyMessage ? "#FFFFFF" : COLORS.primary,
          opacity: isLoaded ? 1 : 0.6,
        }}
      >
        {isBuffering || !isLoaded ? (
          <ActivityIndicator
            size="small"
            color={isMyMessage ? COLORS.primary : "#FFFFFF"}
          />
        ) : (
          <Ionicons
            name={status.playing ? "pause" : "play"}
            size={20}
            color={isMyMessage ? COLORS.primary : "#FFFFFF"}
            style={{ marginLeft: status.playing ? 0 : 2 }}
          />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: "center", minWidth: 0 }}>
        <View
          style={{
            height: 5,
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 6,
            backgroundColor: isMyMessage ? "rgba(255,255,255,0.3)" : COLORS.surfaceLight,
          }}
        >
          <View
            style={{
              height: "100%",
              borderRadius: 3,
              width: `${progress * 100}%`,
              backgroundColor: isMyMessage ? "#FFFFFF" : COLORS.primary,
            }}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 11,
              color: isMyMessage ? "rgba(255,255,255,0.8)" : COLORS.textMuted,
            }}
          >
            {formatTime(currentTimeSec)}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: isMyMessage ? "rgba(255,255,255,0.8)" : COLORS.textMuted,
            }}
          >
            {formatTime(durationSec)}
          </Text>
        </View>
      </View>

      <Ionicons
        name="mic"
        size={16}
        color={isMyMessage ? "rgba(255,255,255,0.7)" : COLORS.primary}
        style={{ marginLeft: 8 }}
      />
    </View>
  );
};