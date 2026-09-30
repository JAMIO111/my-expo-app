import { useMemo } from 'react';
import { useJoinTeamRequests } from '@hooks/useJoinTeamRequests';
import { useJoinDivisionRequests } from '@hooks/useJoinDivisionRequests';

// Everything a league admin may need to act on, as one list of ticket items:
//  - division requests (a team or player asking to join a division)
//  - player team requests and invites (players joining / being invited to teams in the league)
export function useAdminRequestTickets(districtId) {
  const team = useJoinTeamRequests({ districtId });
  const division = useJoinDivisionRequests({ districtId });

  const tickets = useMemo(() => {
    const fromTeams = (team.data || []).map((r) => {
      const isInvite = r.kind === 'invite';
      return {
        key: `tp-${r.id}`,
        ticket_type: isInvite ? 'player_invite' : 'player_request',
        id: r.id,
        status: r.status,
        requested_at: r.requested_at,
        player: r.player,
        team: r.team,
        requester_name: `${r.player?.first_name || ''} ${r.player?.surname || ''}`.trim(),
        awaiting_admin: !!r.awaiting_admin,
        awaiting_captain: !!r.awaiting_captain,
        awaiting_player: !!r.awaiting_player,
        // what the admin can do right now
        canApprove: !!r.awaiting_admin,
        canReject: !isInvite && !!r.awaiting_admin,
        canRevoke: isInvite,
      };
    });

    const fromDivisions = (division.data || []).map((r) => ({
      key: `dm-${r.id}`,
      ticket_type: 'division_request',
      id: r.id,
      status: r.status,
      requested_at: r.requested_at,
      player: r.player_id ? r.player : null,
      team: r.team_id ? r.team : null,
      requester_name: r.player_id
        ? `${r.player?.first_name || ''} ${r.player?.surname || ''}`.trim()
        : r.team?.display_name,
      division_name: r.division_name,
      group_name: r.group_name,
      tier: r.tier,
      awaiting_admin: true,
      canApprove: true,
      canReject: true,
      canRevoke: false,
    }));

    return [...fromDivisions, ...fromTeams].sort((a, b) => {
      const aAct = a.canApprove || a.canReject || a.canRevoke ? 0 : 1;
      const bAct = b.canApprove || b.canReject || b.canRevoke ? 0 : 1;
      if (aAct !== bAct) return aAct - bAct;
      return new Date(a.requested_at || 0) - new Date(b.requested_at || 0);
    });
  }, [team.data, division.data]);

  return {
    tickets,
    actionCount: tickets.filter((t) => t.canApprove || t.canReject).length,
    isLoading: team.isLoading || division.isLoading,
    error: team.error || division.error,
    refetch: () => Promise.all([team.refetch(), division.refetch()]),
  };
}

export default useAdminRequestTickets;
