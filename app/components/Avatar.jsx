import { Text, View } from 'react-native';
import ExpoCachedImage from '@components/ExpoCachedImage';

const Avatar = ({ player, size = 64, borderRadius = 5, backgroundColor = 'bg-brand-light' }) => {
  const getInitials = () => {
    const firstInitial = player?.first_name?.[0] || '';
    const lastInitial = player?.surname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (player?.avatar_url) {
    return (
      <>
        <ExpoCachedImage
          uri={player.avatar_url}
          width={size}
          height={size}
          borderRadius={borderRadius}
        />
      </>
    );
  }

  return (
    <View
      className={`h-14 w-14 rounded-md ${backgroundColor}`}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        style={{ fontSize: size / 3.5, lineHeight: size / 3 }}
        className="pt-1 font-michroma text-white">
        {getInitials()}
      </Text>
    </View>
  );
};

export default Avatar;
