import { View, Text, Image } from "react-native";

export const AVATAR_COLORS = [
    "#F87171",
    "#FBBF24",
    "#34D399",
    "#22D3EE",
    "#A78BFA",
    "#F472B6",
    "#FB923C",
];

export const colorForId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

type Props = {
    id: string;
    name?: string;
    uri?: string | null;
    size?: number;
    squircle?: boolean;
};

export function Avatar({ id, name, uri, size = 40, squircle = false }: Props) {
    const color = colorForId(id);
    const radius = squircle ? size * 0.32 : size / 2;

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                backgroundColor: color + "26",
                borderWidth: 1,
                borderColor: color + "55",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {uri ? (
                <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
            ) : (
                <Text style={{ color, fontWeight: "700", fontSize: size * 0.42 }}>
                    {(name?.trim()?.[0] ?? "?").toUpperCase()}
                </Text>
            )}
        </View>
    );
}