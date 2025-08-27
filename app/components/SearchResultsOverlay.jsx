import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';
import TeamLogo from '@components/TeamLogo';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import Ionicons from '@expo/vector-icons/Ionicons';

const SearchResultsOverlay = ({ searchQuery, sendJoinRequest }) => {
  const { client: supabase } = useSupabaseClient();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const debounceTimeout = useRef(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new debounce timeout
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('Teams')
        .select(
          `
            id,
            display_name,
            abbreviation,
            crest,
            division:Divisions(
            name,
            district:Districts(name)
            )
          `
        )
        .or(`display_name.ilike.%${searchQuery}%,abbreviation.ilike.%${searchQuery}%`)
        .limit(50);

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Error fetching teams',
        });
        console.log('Search Error:', error);
      } else {
        setResults(data);
      }

      setLoading(false);
    }, 500);

    // Cleanup function to clear timeout on unmount or new effect
    return () => clearTimeout(debounceTimeout.current);
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
          <View className="">
            <Text className="font-saira-semibold text-xl text-text-1">{item.display_name}</Text>
            <Text className="font-saira text-xl text-text-2">
              {item.division.district.name} - {item.division.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleSelectTeam(item)}
          className="items-center justify-center rounded-2xl border border-brand-light bg-brand p-3">
          <Ionicons name="send-sharp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View
        style={{ position: 'absolute', top: 67 }}
        className="absolute bottom-0 left-0 right-0 z-50 bg-black/50">
        <View className="flex-1 bg-bg-grouped-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : results.length > 0 ? (
            <>
              <Text className="pl-4 pt-2 font-saira-medium text-2xl text-text-2">
                Search Results:
              </Text>
              <FlatList
                data={results}
                keyExtractor={(item, index) =>
                  item.id ? item.id.toString() : `${item.display_name}-${index}`
                }
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
              />
            </>
          ) : (
            <View className="flex-1 items-center justify-start p-5">
              <Text className="w-full rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-8 py-12 text-center font-saira text-lg text-text-2">
                {searchQuery === '' ? 'Start typing to search for results' : 'No results found'}
              </Text>
            </View>
          )}
        </View>
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
