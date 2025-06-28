import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import React from 'react';
import PlayerCard from 'components/PlayerCard';
import { useUser } from '../../../contexts/UserProvider';
import PlayersList from 'components/PlayersList';
import Heading from 'components/Heading';
import LoadingSplash from 'components/LoadingSplash';
import TeamLogo from 'components/TeamLogo';

const index = () => {
  const { user, player, loading } = useUser();

  if (loading || !player) return <LoadingSplash />;

  console.log('Debug Player:', player);

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          title: player?.team?.name || 'Team',
        }}
      />
      <ScrollView className="bg-background-dark flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <Image
          source={require('../../../assets/cover-photo.jpg')}
          style={{ width: '100%', height: 200 }}
        />
        <View className=" bg-background-light border-border-color w-full flex-row items-center justify-start gap-5 border-b pl-5">
          <View className="border-border-color rounded-full border">
            <TeamLogo size={60} color1="green" color2="red" type="Vertical Stripe" thickness="3" />
          </View>
          <View className="py-5">
            <Text className="text-text-primary text-3xl font-extrabold">{player?.team?.name}</Text>
            <Text className="text-text-secondary text-lg font-medium">
              {player?.team.display_name}
            </Text>
            <Text className="text-text-muted text-md font-medium">
              Shankhouse Club, Cramlington
            </Text>
          </View>
        </View>
        <View className="px-3">
          <Heading text="Roster" />
        </View>
        <PlayersList />
      </ScrollView>
    </React.Fragment>
  );
};

export default index;

const styles = StyleSheet.create({});
