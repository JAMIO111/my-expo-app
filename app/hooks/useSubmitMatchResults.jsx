import { useState } from 'react';
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

export function useSubmitMatchResults(fixtureId, existingResults) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submit = async (frames) => {
    setSubmitting(true);

    try {
      // Map frames to include frameNumber based on order
      const framesWithNumbers = frames.map((f, i) => ({
        id: f.id ?? '', // send empty string if no id
        homePlayer: f.homePlayer || '',
        awayPlayer: f.awayPlayer || '',
        winner: f.winner || '',
        frameNumber: i + 1,
      }));

      // Detect deleted IDs
      const existingIds = new Set(existingResults?.map((r) => r.id));
      const currentIds = new Set(framesWithNumbers.filter((f) => f.id).map((f) => f.id));
      const deletedIds = [...existingIds].filter((id) => !currentIds.has(id));

      // Prepare payload
      // Supabase RPC expects:
      // - _frames: array of frames to upsert/update
      // - _deleted_ids: array of frame IDs to delete
      // - _fixture_id: current fixture ID

      const { error } = await supabase.rpc('submit_match_results', {
        _frames: framesWithNumbers,
        _deleted_ids: deletedIds,
        _fixture_id: fixtureId,
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: error.message,
        });
        setSubmitting(false);
        return false;
      } else {
        Toast.show({
          type: 'success',
          text1: 'Results Submitted',
          text2: 'All frames have been successfully submitted.',
        });

        queryClient.invalidateQueries(['results', fixtureId]);

        setSubmitting(false);
        return true;
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: e.message,
      });
      setSubmitting(false);
      return false;
    }
  };

  return { submitting, submit };
}
