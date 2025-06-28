import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TeamLogo from './TeamLogo';

const stats = [
  { Pos: 1, Team: 'Sports Club', Played: 10, Won: 8, Drawn: 1, Lost: 1, Points: 25, CaptainCup: 3 },
  {
    Pos: 2,
    Team: 'Bedlington Station',
    Played: 10,
    Won: 7,
    Drawn: 2,
    Lost: 1,
    Points: 23,
    CaptainCup: 10,
  },
  { Pos: 3, Team: 'Grapes B', Played: 10, Won: 6, Drawn: 3, Lost: 1, Points: 21, CaptainCup: 5 },
  { Pos: 4, Team: 'Comrades A', Played: 10, Won: 5, Drawn: 3, Lost: 2, Points: 18, CaptainCup: 6 },
  {
    Pos: 5,
    Team: 'Shankhouse B',
    Played: 10,
    Won: 4,
    Drawn: 3,
    Lost: 3,
    Points: 15,
    CaptainCup: 4,
  },
  {
    Pos: 6,
    Team: 'High Street B',
    Played: 10,
    Won: 3,
    Drawn: 4,
    Lost: 3,
    Points: 13,
    CaptainCup: 9,
  },
  { Pos: 7, Team: 'Premier', Played: 10, Won: 2, Drawn: 4, Lost: 4, Points: 10, CaptainCup: 8 },
  {
    Pos: 8,
    Team: 'South Beach Com A',
    Played: 10,
    Won: 1,
    Drawn: 3,
    Lost: 6,
    Points: 6,
    CaptainCup: 7,
  },
  { Pos: 9, Team: 'Regent B', Played: 10, Won: 1, Drawn: 2, Lost: 7, Points: 5, CaptainCup: 2 },
  { Pos: 10, Team: 'Comrades B', Played: 10, Won: 0, Drawn: 1, Lost: 9, Points: 1, CaptainCup: 1 },
  { Pos: 11, Team: 'Sun Inn', Played: 10, Won: 0, Drawn: 0, Lost: 10, Points: 0, CaptainCup: 0 },
  { Pos: 12, Team: 'Charltons', Played: 10, Won: 0, Drawn: 0, Lost: 10, Points: 0, CaptainCup: 0 },
  {
    Pos: 13,
    Team: 'South Beach Com B',
    Played: 10,
    Won: 0,
    Drawn: 0,
    Lost: 10,
    Points: 0,
    CaptainCup: 0,
  },
  {
    Pos: 14,
    Team: 'Seghill Comrades',
    Played: 10,
    Won: 0,
    Drawn: 0,
    Lost: 10,
    Points: 0,
    CaptainCup: 0,
  },
  { Pos: 15, Team: 'Clayton', Played: 10, Won: 0, Drawn: 0, Lost: 10, Points: 0, CaptainCup: 0 },
  {
    Pos: 16,
    Team: 'New Hartley A',
    Played: 10,
    Won: 0,
    Drawn: 0,
    Lost: 10,
    Points: 0,
    CaptainCup: 0,
  },
];

const LeagueTable = () => {
  return (
    <View className="bg-background flex-1 items-center">
      <View className="w-screen">
        <View className="border-border-color mx-2 h-12 flex-row items-center justify-around border-b pr-3">
          <Text className="text-brand-light w-12 text-center font-bold">Pos</Text>
          <Text className="text-brand-light flex-1 pl-3 text-left font-bold">Team</Text>
          <Text className="text-brand-light w-8 text-center font-bold">PL</Text>
          <Text className="text-brand-light w-8 text-center font-bold">W</Text>
          <Text className="text-brand-light w-8 text-center font-bold">D</Text>
          <Text className="text-brand-light w-8 text-center font-bold">L</Text>
          <Text className="text-brand-light w-9 text-center font-bold">Pts</Text>
          <Text className="text-brand-light w-8 text-center font-bold">CC</Text>
        </View>
        {stats.map((team, index) => (
          <React.Fragment key={index}>
            {index === stats.length - 3 && (
              <LinearGradient
                colors={['#8b5cf6', '#dc2626', '#dc2626']} // from-purple-500 to-red-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2, width: '100%' }}
              />
            )}
            <View className="border-border-color mx-2 flex-row items-center justify-around border-b py-3 pr-3">
              <Text className="text-text-primary w-12 text-center text-lg">{team.Pos}</Text>
              <View className="flex-1 flex-row items-center gap-3 pl-4">
                <TeamLogo size={20} />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="text-text-primary flex-1 text-left font-semibold">
                  {team.Team}
                </Text>
              </View>
              <Text className="text-text-primary w-8 text-center text-lg">{team.Played}</Text>
              <Text className="text-text-primary w-8 text-center text-lg">{team.Won}</Text>
              <Text className="text-text-primary w-8 text-center text-lg">{team.Drawn}</Text>
              <Text className="text-text-primary w-8 text-center text-lg">{team.Lost}</Text>
              <Text className="text-text-primary w-9 text-center text-lg font-semibold">
                {team.Points}
              </Text>
              <Text className="w-8 text-center text-lg font-semibold text-orange-500">
                {team.CaptainCup}
              </Text>
            </View>
            {index === 2 && (
              <LinearGradient
                colors={['#00ffee', '#7c3aed', '#7c3aed']} // from-purple-500 to-purple-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2, width: '100%' }}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default LeagueTable;
