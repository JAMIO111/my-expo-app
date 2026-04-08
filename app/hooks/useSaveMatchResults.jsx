import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

export function useSaveMatchResults(fixtureId, existingResults) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const save = async (frames) => {
    setSaving(true);

    try {
      console.log('Saving frames:', frames);
      console.log('Existing results:', existingResults);
      // Map frames to include frameNumber based on order
      const framesWithNumbers = frames.map((f, i) => ({
        id: f.id ?? null,
        homePlayer1: f.homePlayer1.id || null, // REQUIRED
        homePlayer2: f.homePlayer2?.id || null, // OPTIONAL
        awayPlayer1: f.awayPlayer1.id || null, // REQUIRED
        awayPlayer2: f.awayPlayer2?.id || null, // OPTIONAL
        winnerSide: f.winnerSide || null,
        breakDish: f.breakDish || false,
        reverseDish: f.reverseDish || false,
        lagWon: f.lagWon || null,
        frameNumber: i + 1,
        status: 'pending',
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

      const { error } = await supabase.rpc('save_match_results', {
        _frames: framesWithNumbers,
        _deleted_ids: deletedIds,
        _fixture_id: fixtureId,
      });

      if (error) {
        console.error('Save RPC Error:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: error.message,
        });
        setSaving(false);
        return false;
      } else {
        Toast.show({
          type: 'success',
          text1: 'Results Saved',
          text2: 'All frames have been successfully saved.',
        });

        queryClient.invalidateQueries(['results', fixtureId]);

        setSaving(false);
        return true;
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: e.message,
      });
      setSaving(false);
      return false;
    }
  };

  return { saving, save };
}
