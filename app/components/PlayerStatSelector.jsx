import { ArrowUpDown, CircleCheckBig, Zap, Undo2 } from 'lucide-react-native';
import { View, Text, Pressable } from 'react-native';

export default function PlayerStatSelector({ activeFrame, updateActiveFrame, context }) {
  console.log('activeFrame in PlayerStatSelector:', activeFrame);
  const currentPlayer = activeFrame[context]?.id;
  console.log('currentPlayer in PlayerStatSelector:', currentPlayer);

  const dishDisabled =
    (activeFrame.winnerSide === 'home' && context.startsWith('away')) ||
    (activeFrame.winnerSide === 'away' && context.startsWith('home'));

  const breakDishFields = {
    homePlayer1: 'breakDish1',
    homePlayer2: 'breakDish2',
    awayPlayer1: 'breakDish1',
    awayPlayer2: 'breakDish2',
  };

  const reverseDishFields = {
    homePlayer1: 'reverseDish1',
    homePlayer2: 'reverseDish2',
    awayPlayer1: 'reverseDish1',
    awayPlayer2: 'reverseDish2',
  };

  const lagSelected = activeFrame.lagWon === currentPlayer;
  const breakDishSelected = activeFrame[breakDishFields[context]] === currentPlayer;
  const reverseDishSelected = activeFrame[reverseDishFields[context]] === currentPlayer;

  return (
    <View className={`flex-1 flex-col gap-2`}>
      <Pressable
        onPress={() => updateActiveFrame('lagWon', lagSelected ? null : currentPlayer)}
        className={`flex-row items-center justify-center rounded-2xl border px-2 py-1 ${
          lagSelected ? 'border-brand bg-brand' : 'border-theme-gray-5 bg-bg-2'
        }`}>
        <View className="flex-1 flex-row items-center justify-start gap-2 pl-2">
          <ArrowUpDown size={16} color={lagSelected ? 'white' : '#000'} />
          <Text
            numberOfLines={1}
            className={`font-saira-medium ${lagSelected ? 'text-white' : 'text-text-1'}`}>
            Lag Won
          </Text>
        </View>
        {lagSelected ? (
          <CircleCheckBig size={20} color={'white'} />
        ) : (
          <View
            style={{ height: 20, width: 20, borderWidth: 1.5, borderColor: '#777' }}
            className="items-center justify-center rounded-full border bg-bg-1"
          />
        )}
      </Pressable>
      <Pressable
        disabled={dishDisabled}
        onPress={() =>
          updateActiveFrame(breakDishFields[context], breakDishSelected ? null : currentPlayer)
        }
        className={`flex-row items-center justify-center rounded-2xl border px-2 py-1 ${
          breakDishSelected ? 'border-brand bg-brand' : 'border-theme-gray-5 bg-bg-2'
        }`}>
        <View className="flex-1 flex-row items-center justify-start gap-2 pl-2">
          <Zap size={16} color={breakDishSelected ? 'white' : dishDisabled ? '#999' : '#000'} />
          <Text
            numberOfLines={1}
            className={`font-saira-medium ${breakDishSelected ? 'text-white' : dishDisabled ? 'text-text-3' : 'text-text-1'}`}>
            Break Dish
          </Text>
        </View>
        {breakDishSelected ? (
          <CircleCheckBig size={20} color={'white'} />
        ) : (
          <View
            style={{
              height: 20,
              width: 20,
              borderWidth: 1.5,
              borderColor: dishDisabled ? '#DDD' : '#777',
            }}
            className={`items-center justify-center rounded-full border ${dishDisabled ? 'bg-bg-2' : 'bg-bg-1'}`}
          />
        )}
      </Pressable>
      <Pressable
        disabled={dishDisabled}
        onPress={() =>
          updateActiveFrame(reverseDishFields[context], reverseDishSelected ? null : currentPlayer)
        }
        className={`flex-row items-center justify-center rounded-2xl border px-2 py-1 ${
          reverseDishSelected ? 'border-brand bg-brand' : 'border-theme-gray-5 bg-bg-2'
        }`}>
        <View className="flex-1 flex-row items-center justify-start gap-2 pl-2">
          <Undo2 size={16} color={reverseDishSelected ? 'white' : dishDisabled ? '#999' : '#000'} />
          <Text
            numberOfLines={1}
            className={`font-saira-medium ${reverseDishSelected ? 'text-white' : dishDisabled ? 'text-text-3' : 'text-text-1'}`}>
            Reverse Dish
          </Text>
        </View>
        {reverseDishSelected ? (
          <CircleCheckBig size={20} color={'white'} />
        ) : (
          <View
            style={{
              height: 20,
              width: 20,
              borderWidth: 1.5,
              borderColor: dishDisabled ? '#DDD' : '#777',
            }}
            className={`items-center justify-center rounded-full border ${dishDisabled ? 'bg-bg-2' : 'bg-bg-1'}`}
          />
        )}
      </Pressable>
    </View>
  );
}
