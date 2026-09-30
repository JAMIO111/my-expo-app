import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { handleFixtureError } from '@lib/fixtureActionErrors';

// Frames as the RPCs expect them (frame numbers follow list order) plus the ids of
// frames that were removed from the list.
const toPayload = (frames, existingResults) => {
  const framesWithNumbers = frames.map((f, i) => ({
    id: f.id ?? null,
    homePlayer1: f.homePlayer1?.id || null,
    homePlayer2: f.homePlayer2?.id || null,
    awayPlayer1: f.awayPlayer1?.id || null,
    awayPlayer2: f.awayPlayer2?.id || null,
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
  const existingIds = new Set(existingResults?.map((r) => r.id));
  const currentIds = new Set(framesWithNumbers.filter((f) => f.id).map((f) => f.id));
  const deletedIds = [...existingIds].filter((id) => !currentIds.has(id));
  return { framesWithNumbers, deletedIds };
};

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
      const { framesWithNumbers, deletedIds } = toPayload(frames, existingResults);

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

  // League admin: apply the edited frames to an escalated fixture and approve it in one step.
  const resolve = async (frames, { rejectForfeit = false } = {}) => {
    setSaving(true);
    try {
      const { framesWithNumbers, deletedIds } = toPayload(frames, existingResults);
      const { error } = await supabase.rpc('resolve_escalated_fixture', {
        p_fixture_id: fixtureId,
        p_frames: framesWithNumbers,
        p_deleted_ids: deletedIds,
        p_expected_version: fixtureVersion ?? null,
        p_reject_forfeit: rejectForfeit,
      });
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ResultsByFixture', fixtureId] }),
        queryClient.invalidateQueries({ queryKey: ['fixture-details', fixtureId] }),
        queryClient.invalidateQueries({ queryKey: ['EscalatedFixtures'] }),
        queryClient.invalidateQueries({ queryKey: ['FixturesAwaitingResults'] }),
      ]);
      Toast.show({
        type: 'success',
        text1: 'Fixture Resolved',
        text2: 'The result has been saved and approved.',
      });
      return true;
    } catch (e) {
      console.error('Resolve RPC Error:', e?.message);
      await handleFixtureError(e, {
        fallbackTitle: 'Could not resolve fixture',
        fallbackMessage: e?.message,
        queryClient,
        fixtureId,
        onStale,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saving, save, resolve };
}

export default useSaveMatchResults;
