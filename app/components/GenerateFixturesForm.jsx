import { View, Text, Switch } from 'react-native';
import { useState } from 'react';
import CustomTextInput from './CustomTextInput';
import CTAButton from './CTAButton';
import { supabase } from '@lib/supabase';
import Toast from 'react-native-toast-message';

const GenerateFixturesForm = ({
  competitionInstanceId,
  startDate = new Date(),
  matchTime = '20:00',
  frequencyType = 'days',
  interval = 7,
  selectedDays = [4],
}) => {
  const [fixturePreview, setFixturePreview] = useState([]);
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  return (
    <View className="flex-1 gap-4 p-5">
      <CTAButton
        type="yellow"
        text={generatingFixtures ? 'Generating...' : 'Preview Fixtures'}
        disabled={generatingFixtures}
        callbackFn={async () => {
          setGeneratingFixtures(true);

          try {
            const { data, error } = await supabase.rpc('generate_league_fixtures_preview', {
              p_competition_instance_id: competitionInstanceId,
              p_start_date: startDate,
              p_match_time: matchTime,
              p_frequency_type: frequencyType,
              p_frequency_interval: interval,
              p_days_of_week: selectedDays,
              p_rounds: 2,
              p_excluded_ranges: [],
            });

            if (error) {
              console.error('Error generating fixture preview:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message,
              });
              return;
            }

            setFixturePreview(data?.fixtures ?? []);
          } catch (err) {
            console.error('Error generating fixture preview:', err);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'An unexpected error occurred while generating the fixture preview.',
            });
          } finally {
            setGeneratingFixtures(false);
          }
        }}
      />
    </View>
  );
};

export default GenerateFixturesForm;
