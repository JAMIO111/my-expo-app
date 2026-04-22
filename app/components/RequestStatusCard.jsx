import { View, Text } from 'react-native';
import TeamLogo from './TeamLogo';
import CTAButton from './CTAButton';

const RequestStatusCard = ({ request, onCancel }) => {
  const Row = ({ label, approvedAt, approvedBy }) => {
    const isApproved = !!approvedAt;

    return (
      <View className="flex-row items-center justify-between border-b border-bg-2 py-3">
        <View className="flex-row items-center gap-3">
          <View
            className={`h-5 w-5 rounded-full ${isApproved ? 'bg-theme-green' : 'bg-theme-orange'}`}
          />

          <View>
            <Text className="text-text-on-bg-1 font-saira-semibold">{label}</Text>

            <Text className="text-md text-text-on-bg-2 font-saira">
              {isApproved
                ? `Approved by ${approvedBy?.first_name || ''} ${approvedBy?.surname || ''}`
                : 'Pending'}
            </Text>
          </View>
        </View>

        <Text className="text-md text-text-on-bg-2 font-saira">
          {approvedAt ? new Date(approvedAt).toLocaleDateString() : '—'}
        </Text>
      </View>
    );
  };

  const status = request?.status;

  // 🔥 derive requirement from status only
  const requiresCaptain =
    status === 'pending_captain' ||
    status === 'pending_both' ||
    request?.accepted_at_captain !== null;

  const requiresAdmin =
    status === 'pending_admin' || status === 'pending_both' || request?.accepted_at_admin !== null;

  return (
    <View style={{ borderRadius: 26 }} className="bg-bg-1 p-3 shadow-lg">
      <View className="rounded-3xl bg-bg-1 p-5 shadow-lg">
        {/* HEADER */}
        <Text className="text-text-on-bg-1 mb-4 font-saira-semibold text-lg">
          Join Request Status
        </Text>

        <View className="h-12 w-full flex-row items-center border-b border-bg-2 pb-4">
          <TeamLogo size={30} {...request?.team?.crest} />
          <Text className="ml-3 font-saira-semibold text-xl">{request?.team?.display_name}</Text>
        </View>

        {/* 🧠 CONDITIONAL ROWS (derived from status only) */}
        {requiresCaptain && (
          <Row
            label="Captain Approval"
            approvedAt={request?.accepted_at_captain}
            approvedBy={request?.accepted_by_captain}
          />
        )}

        {requiresAdmin && (
          <Row
            label="Admin Approval"
            approvedAt={request?.accepted_at_admin}
            approvedBy={request?.accepted_by_admin}
          />
        )}

        {/* REQUEST TIME */}
        <View className="py-5">
          <Text className="text-md text-text-on-bg-2 font-saira">
            Requested:{' '}
            {request?.requested_at ? new Date(request.requested_at).toLocaleString() : '—'}
          </Text>
        </View>

        <CTAButton type="error" text="Cancel Request" callbackFn={onCancel} />
      </View>
    </View>
  );
};

export default RequestStatusCard;
