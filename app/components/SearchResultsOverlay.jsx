import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import TeamLogo from '@components/TeamLogo';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import Ionicons from '@expo/vector-icons/Ionicons';

const SearchResultsOverlay = ({ searchActive, searchQuery, sendJoinRequest }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchTeams = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Teams')
        .select(
          `id, display_name, abbreviation, crest, division:Divisions(name, district:Districts(name))`
        )
        .or(`display_name.ilike.%${searchQuery}%,abbreviation.ilike.%${searchQuery}%`)
        .limit(50);

      if (error) {
        Toast.show({ type: 'error', text1: 'Error fetching teams' });
        console.log('Search Error:', error);
      } else {
        setResults(data);
      }

      setIsLoading(false);
    };

    fetchTeams();
  }, [searchQuery]);

  const handleSelectTeam = (team) => {
    setConfirmConfig({
      title: 'Join Team?',
      message: `Are you sure you want to request to join ${team.display_name}?`,
      topButtonText: 'Send Request',
      bottomButtonText: 'Cancel',
      topButtonType: 'success',
      bottomButtonType: 'default',
      topButtonFn: () => {
        sendJoinRequest.mutate(team.id);
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity className="border-b border-theme-gray-5 p-4">
      <View className="flex-row items-center gap-5">
        <TeamLogo {...item?.crest} size={50} />
        <View className="flex-1">
          <Text className="font-saira-semibold text-xl text-text-1">{item.display_name}</Text>
          <Text className="font-saira text-xl text-text-2">
            {item.division?.district?.name} - {item.division?.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleSelectTeam(item)}
          className="items-center justify-center rounded-2xl border border-brand-light bg-brand p-3">
          <Ionicons name="send-sharp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!searchQuery) {
      return (
        <View className="h-40 p-5">
          <Text className="w-full rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-8 py-12 text-center font-saira text-lg text-text-2">
            Start typing to search for results
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="h-40 p-5">
          <View className="flex-1 flex-row items-center justify-center gap-5 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-5">
            <ActivityIndicator size="small" color="#ccc" />
            <Text className="text-lg text-text-2">Loading...</Text>
          </View>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View className="h-40 p-5">
          <Text className="w-full rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-8 py-12 text-center font-saira text-lg text-text-2">
            No results found
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item, index) =>
          item.id ? item.id.toString() : `${item.display_name}-${index}`
        }
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  // Keep mounted, control visibility via opacity / pointerEvents
  if (!searchActive) return null;

  return (
    <>
      <View style={{ position: 'absolute', top: 67, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
        <View className="flex-1 bg-bg-grouped-1">{renderContent()}</View>
      </View>

      <FloatingBottomSheet
        visible={modalVisible}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        topButtonText={confirmConfig?.topButtonText}
        bottomButtonText={confirmConfig?.bottomButtonText}
        topButtonType={confirmConfig?.topButtonType}
        bottomButtonType={confirmConfig?.bottomButtonType}
        topButtonFn={confirmConfig?.topButtonFn}
        bottomButtonFn={confirmConfig?.bottomButtonFn}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
};

export default SearchResultsOverlay;
