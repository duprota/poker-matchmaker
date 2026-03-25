import Avatar from "boring-avatars";

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size: number;
  className?: string;
}

export const PlayerAvatar = ({ name, avatarUrl, size, className = "" }: PlayerAvatarProps) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Avatar
      size={size}
      name={name}
      variant="beam"
      colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
    />
  );
};
