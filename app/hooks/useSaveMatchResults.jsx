import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { handleFixtureError } from '@lib/fixtureActionErrors';

// `fixtureVersion` is Fixtures.results_version as loaded by the screen. Every save
// returns the new version, which is kept here so consecutive saves from this screen
// stay in step. If another captain / vice captain saved in between, the RPC rejects
// with fixture_changed and `onStale` is called (e.g. to leave the screen).
export function useSaveMatchResults(fixtureId, existingResults, fixtureVersion, onStale) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const versionRef = useRef(null);

  const save = async (frames, submit = false) => {
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
        breakDish1: f.breakDish1 || null,
        breakDish2: f.breakDish2 || null,
        reverseDish1: f.reverseDish1 || null,
        reverseDish2: f.reverseDish2 || null,
        lagWon: f.lagWon || null,
        bonusFrame: f.bonusFrame || false,
        frameType: f.frameType || 'singles',
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

      console.log('Frames to save:', framesWithNumbers);

      const { data: newVersion, error } = await supabase.rpc('save_fixture_results', {
        _frames: framesWithNumbers,
        _deleted_ids: deletedIds,
        _fixture_id: fixtureId,
        _submit: submit,
        _expected_version: versionRef.current ?? fixtureVersion ?? null,
      });

      if (error) {
        console.error('Save RPC Error:', error.message);
        versionRef.current = null;
        await handleFixtureError(error, {
          fallbackTitle: submit ? 'Submission Failed' : 'Save Failed',
          fallbackMessage: error.message,
          queryClient,
          fixtureId,
          onStale,
        });
        return false;
      } else {
        if (typeof newVersion === 'number') versionRef.current = newVersion;
        await queryClient.invalidateQueries({ queryKey: ['ResultsByFixture', fixtureId] });
        await queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] });

        Toast.show({
          type: 'success',
          text1: `Results ${submit ? 'Submitted' : 'Saved'}`,
          text2: `All frames have been successfully ${submit ? 'submitted' : 'saved'}.`,
        });

        return true;
      }
    } catch (e) {
      await handleFixtureError(e, {
        fallbackTitle: 'Unexpected Error',
        fallbackMessage: e.message,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saving, save };
}

export default useSaveMatchResults;
