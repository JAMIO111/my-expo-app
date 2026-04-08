import { Pressable, StyleSheet, Text, View, Modal, TextInput, Keyboard } from 'react-native';
import { useState } from 'react';
import CTAButton from './CTAButton';
import Ionicons from '@expo/vector-icons/Ionicons';

const getPlayerNames = (...players) =>
  players
    .filter(Boolean)
    .map((p) => `${p.first_name} ${p.surname}`)
    .join(' & ');

const ConfirmFramesList = ({ results, isLoading, disputedFrames, setDisputedFrames }) => {
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [comment, setComment] = useState('');

  if (isLoading) {
    return (
      <View className="flex-row items-center justify-center bg-bg-1 py-12">
        <Text className="text-center font-saira text-xl text-text-2">Loading frames...</Text>
      </View>
    );
  }

  const getDispute = (id) => disputedFrames.find((d) => d.id === id);

  const handleCloseModal = () => {
    if (!editingFrame) return;

    const existing = getDispute(editingFrame.id);

    // ❌ If no existing comment AND no new comment → remove dispute
    if (!existing && !comment.trim()) {
      setDisputedFrames((prev) => prev.filter((d) => d.id !== editingFrame.id));
    }

    setComment('');
    setEditingFrame(null);
    setCommentModalVisible(false);
  };

  const handleCancelDispute = () => {
    if (!editingFrame) return;

    // remove dispute completely
    setDisputedFrames((prev) => prev.filter((d) => d.id !== editingFrame.id));

    setComment('');
    setEditingFrame(null);
    setCommentModalVisible(false);
  };

  const handleSaveComment = () => {
    if (!editingFrame || !comment.trim()) return;

    setDisputedFrames((prev) => {
      const exists = prev.find((d) => d.id === editingFrame.id);

      if (exists) {
        // update comment
        return prev.map((d) => (d.id === editingFrame.id ? { ...d, comment } : d));
      }

      // add new dispute
      return [...prev, { id: editingFrame.id, comment }];
    });

    setComment('');
    setEditingFrame(null);
    setCommentModalVisible(false);
  };

  console.log('results in ConfirmFramesList:', results);
  console.log('disputedFrames in ConfirmFramesList:', disputedFrames);

  return (
    <>
      <View className="flex-1 gap-2 p-2">
        {results?.length > 0 ? (
          results.map((result, index) => {
            const homeWinner = result.winner_side === 'home';
            const awayWinner = result.winner_side === 'away';

            const dispute = getDispute(result.id);
            const isDisputed = !!dispute;

            const doublesMatch = result.home_player_2 && result.away_player_2;

            const disputeComment = dispute?.comment || 'No comment provided.';

            return (
              <Pressable
                key={result.id}
                onPress={() => {
                  setEditingFrame(result);
                  setComment(dispute?.comment || '');
                  setCommentModalVisible(true);
                }}>
                <View className="relative mt-1 gap-1 rounded-xl bg-bg-1 pb-3 shadow-sm">
                  {/* Title */}
                  <View className="flex-row items-center gap-2 pt-2">
                    <Text
                      className={`${
                        isDisputed ? 'font-semibold text-theme-red' : 'font-medium'
                      } pl-5 font-saira text-text-2`}>
                      {`Frame ${result.frame_number}${isDisputed ? ' - Disputed' : ''}`}
                    </Text>
                  </View>

                  {/* Home */}
                  <View className="flex-row items-center justify-between gap-3">
                    <View
                      className={`${
                        homeWinner ? (isDisputed ? 'bg-theme-red' : 'bg-brand') : 'bg-transparent'
                      }`}
                      style={styles.indicator}
                    />

                    <Text
                      numberOfLines={1}
                      className={`${
                        homeWinner ? 'font-saira-semibold' : 'font-saira'
                      } mt-1 flex-1 ${doublesMatch ? 'text-lg' : 'text-xl'} text-text-1`}>
                      {getPlayerNames(result.home_player_1, result.home_player_2)}
                    </Text>

                    <Text
                      className={`${
                        homeWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'
                      } pr-5 ${doublesMatch ? 'text-lg' : 'text-xl'}`}>
                      {homeWinner ? 'Winner' : 'Loser'}
                    </Text>
                  </View>

                  {/* Away */}
                  <View className="flex-row items-center justify-between gap-3">
                    <View
                      className={`${
                        awayWinner ? (isDisputed ? 'bg-theme-red' : 'bg-brand') : 'bg-transparent'
                      }`}
                      style={styles.indicator}
                    />

                    <Text
                      numberOfLines={1}
                      className={`${
                        awayWinner ? 'font-saira-semibold' : 'font-saira'
                      } mt-1 flex-1 ${doublesMatch ? 'text-lg' : 'text-xl'} text-text-1`}>
                      {getPlayerNames(result.away_player_1, result.away_player_2)}
                    </Text>

                    <Text
                      className={`${
                        awayWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'
                      } pr-5 ${doublesMatch ? 'text-lg' : 'text-xl'}`}>
                      {awayWinner ? 'Winner' : 'Loser'}
                    </Text>
                  </View>
                  {isDisputed && (
                    <View className="mt-2 justify-center border-t border-theme-gray-3 p-3 pb-1">
                      <Text className="font-saira-medium text-theme-red">{disputeComment}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text className="px-12 py-16 text-center font-saira text-xl text-text-2">
            No frames have been submitted for this fixture yet.
          </Text>
        )}
      </View>

      <Modal
        visible={commentModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleCloseModal}>
        <View className="flex-1 justify-center bg-black/40 p-6 shadow-md">
          <View className="gap-3 rounded-3xl bg-bg-2 p-2">
            <View className="flex-row items-start justify-between p-3">
              <View className="flex-1 gap-1">
                <Text className="font-saira-semibold text-2xl text-text-1">Leave a comment</Text>

                <Text className="font-saira text-text-2">
                  This should be descriptive enough so that the home team can correct the fixture.
                  E.g. 'Home player 2 is incorrect, it should be John Doe instead of Jane Doe.' or
                  'The winner is incorrect, it should be the away team instead of the home team.'
                </Text>
              </View>

              <Ionicons name="close" size={32} color="#777" onPress={handleCloseModal} />
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment about the disputed frame (required)."
              placeholderTextColor="#777"
              multiline
              returnKeyType="done"
              maxLength={1000}
              className="min-h-[220px] rounded-2xl border border-theme-gray-3 bg-bg-1 p-4 text-text-1"
              style={{ textAlignVertical: 'top' }}
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <CTAButton type="error" text="Cancel Dispute" callbackFn={handleCancelDispute} />
            <CTAButton type="success" text="Save" callbackFn={handleSaveComment} />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ConfirmFramesList;

const styles = StyleSheet.create({
  indicator: {
    height: 26,
    width: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
});
