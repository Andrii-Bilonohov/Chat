import { useRef } from "react";
import { Modal, Image, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
};

export function ImageViewerModal({ visible, imageUrl, onClose }: Props) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const lastUrl = useRef<string | null>(imageUrl);
    if (imageUrl) lastUrl.current = imageUrl;

    if (!lastUrl.current) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center" }}>
                <Image
                    source={{ uri: lastUrl.current }}
                    style={{ width, height: height * 0.8 }}
                    resizeMode="contain"
                />
                <TouchableOpacity
                    onPress={onClose}
                    style={{
                        position: "absolute",
                        top: insets.top + 8,
                        right: 16,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="close" size={26} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}