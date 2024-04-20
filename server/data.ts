export interface Message {
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Player {
    id: string;
    name: string;
    role: Role;
    status: "Alive" | "Dead";
    votes: string[];
    killVote: string[];
  }

export interface GameState {
  players: Player[];
  round: number;
  phase: "day" | "night" | "pre-game" | "end";
  hostId: string;
}

export enum Role {
  Villager = "Villager",
  Mafia = "Mafia",
  Detective = "Detective",
  Doctor = "Doctor"
}


export function calculateMostVoted(gameState: GameState): string | null {
  const voteCounts: Record<string, number> = {}; // A record to keep track of votes for each player

  // Iterate over each player to tally votes
  gameState.players.forEach(player => {
    player.votes.forEach((voteId) => {
      if (voteCounts[voteId]) {
        voteCounts[voteId]++;
      } else {
        voteCounts[voteId] = 1;
      }
    });
  });

  // Find the player with the maximum number of votes
  let maxVotes = -1;
  let mostVotedPlayerId: string | null = null;

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if(count === maxVotes){
      mostVotedPlayerId = null;
    }
    else if (count > maxVotes) {
      maxVotes = count;
      mostVotedPlayerId = playerId;
    }
  }

  return mostVotedPlayerId; // Return the player ID with the most votes
}

export function assignRole(players: Player[]): Role | null {
  const roleCounts = new Map<Role, number>([
    [Role.Villager, 2],
    [Role.Mafia, 1],
    [Role.Doctor, 1],
    [Role.Detective, 1]
  ]);
  players.forEach(player => {
    if (player.role && roleCounts.has(player.role)) {
      const currentCount = roleCounts.get(player.role) ?? 0;
      roleCounts.set(player.role, Math.max(0, currentCount - 1));
    }
  });
  const availableRoles: Role[] = [];
  roleCounts.forEach((count, role) => {
    for (let i = 0; i < count; i++) {
      availableRoles.push(role)
    }
  })
  const randomIndex = Math.floor(Math.random() * availableRoles.length);
  const selectedRole = availableRoles[randomIndex];
  return selectedRole;
}