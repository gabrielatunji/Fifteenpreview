import { useState, useEffect } from 'react';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  timestamp: number;
  status: string;
  competition: string;
  venue?: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
}

// Cache for team badges to avoid repeated API calls
const teamBadgeCache: { [key: string]: string } = {};

export const useSportsData = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch team badge by team name
  const fetchTeamBadge = async (teamName: string): Promise<string> => {
    // Check cache first
    if (teamBadgeCache[teamName]) {
      return teamBadgeCache[teamName];
    }

    try {
      // Search for team by name
      const searchResponse = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.teams && searchData.teams.length > 0) {
          const badge = searchData.teams[0].strTeamBadge;
          if (badge) {
            teamBadgeCache[teamName] = badge;
            return badge;
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching badge for ${teamName}:`, error);
    }

    // Fallback: try to get badge from league teams
    try {
      const popularTeams: { [key: string]: string } = {
        'Manchester United': 'https://www.thesportsdb.com/images/media/team/badge/xtwxyt1421431910.png',
        'Liverpool': 'https://www.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
        'Barcelona': 'https://www.thesportsdb.com/images/media/team/badge/vwvwrw1473502456.png',
        'Real Madrid': 'https://www.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png',
        'Bayern Munich': 'https://www.thesportsdb.com/images/media/team/badge/uvwqyr1473502546.png',
        'Borussia Dortmund': 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1473502646.png',
        'PSG': 'https://www.thesportsdb.com/images/media/team/badge/rqyxqq1473502816.png',
        'Marseille': 'https://www.thesportsdb.com/images/media/team/badge/svtqpp1473503505.png',
        'AC Milan': 'https://www.thesportsdb.com/images/media/team/badge/trwqyw1473503452.png',
        'Inter Milan': 'https://www.thesportsdb.com/images/media/team/badge/stqtsx1473503467.png',
        'Arsenal': 'https://www.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
        'Chelsea': 'https://www.thesportsdb.com/images/media/team/badge/vwrprt1473502605.png',
        'Manchester City': 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1473502646.png',
        'Tottenham': 'https://www.thesportsdb.com/images/media/team/badge/tyiwey1473502714.png',
        'Atletico Madrid': 'https://www.thesportsdb.com/images/media/team/badge/rupuwy1473502492.png',
        'Juventus': 'https://www.thesportsdb.com/images/media/team/badge/rqyxqq1473502816.png',
        'Napoli': 'https://www.thesportsdb.com/images/media/team/badge/svtqpp1473503505.png',
        'Roma': 'https://www.thesportsdb.com/images/media/team/badge/trwqyw1473503452.png',
      };

      if (popularTeams[teamName]) {
        teamBadgeCache[teamName] = popularTeams[teamName];
        return popularTeams[teamName];
      }
    } catch (error) {
      console.error(`Error fetching fallback badge for ${teamName}:`, error);
    }

    // Final fallback - return empty string
    return '';
  };

  // Enhanced mock data with real team names
  const fetchMockMatches = async (): Promise<Match[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentTime = Math.floor(Date.now() / 1000);
    const oneHour = 3600;
    const oneDay = 86400;

    const mockMatches = [
      {
        id: '1',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        matchTime: new Date(currentTime + oneHour * 2).toISOString(),
        timestamp: currentTime + oneHour * 2,
        status: 'Scheduled',
        competition: 'Premier League',
      },
      {
        id: '2',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        matchTime: new Date(currentTime + oneDay).toISOString(),
        timestamp: currentTime + oneDay,
        status: 'Scheduled',
        competition: 'La Liga',
      },
      {
        id: '3',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        matchTime: new Date(currentTime + oneDay * 2).toISOString(),
        timestamp: currentTime + oneDay * 2,
        status: 'Scheduled',
        competition: 'Bundesliga',
      },
      {
        id: '4',
        homeTeam: 'PSG',
        awayTeam: 'Marseille',
        league: 'Ligue 1',
        matchTime: new Date(currentTime + oneHour * 6).toISOString(),
        timestamp: currentTime + oneHour * 6,
        status: 'Scheduled',
        competition: 'Ligue 1',
      },
      {
        id: '5',
        homeTeam: 'AC Milan',
        awayTeam: 'Inter Milan',
        league: 'Serie A',
        matchTime: new Date(currentTime + oneDay * 3).toISOString(),
        timestamp: currentTime + oneDay * 3,
        status: 'Scheduled',
        competition: 'Serie A',
      },
    ];

    // Enhance mock matches with badges
    const enhancedMatches = await Promise.all(
      mockMatches.map(async (match) => {
        const [homeBadge, awayBadge] = await Promise.all([
          fetchTeamBadge(match.homeTeam),
          fetchTeamBadge(match.awayTeam)
        ]);
        
        return {
          ...match,
          homeTeamBadge: homeBadge,
          awayTeamBadge: awayBadge
        };
      })
    );

    return enhancedMatches;
  };

  // Fetch multiple leagues
  const fetchAllMatches = async (): Promise<Match[]> => {
    const leagueIds = [
      '4328', // English Premier League
      '4335', // La Liga
      '4331', // Bundesliga
      '4332', // Serie A
      '4334', // Ligue 1
    ];

    const allMatches: Match[] = [];

    for (const leagueId of leagueIds) {
      try {
        const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.events) {
            const leagueMatches = await Promise.all(
              data.events.map(async (event: any) => {
                const [homeBadge, awayBadge] = await Promise.all([
                  fetchTeamBadge(event.strHomeTeam),
                  fetchTeamBadge(event.strAwayTeam)
                ]);

                return {
                  id: event.idEvent,
                  homeTeam: event.strHomeTeam,
                  awayTeam: event.strAwayTeam,
                  league: event.strLeague,
                  matchTime: event.strTimestamp || event.dateEvent + 'T' + event.strTime,
                  timestamp: Math.floor(new Date(event.strTimestamp || event.dateEvent + 'T' + event.strTime).getTime() / 1000),
                  status: event.strStatus,
                  competition: event.strLeague,
                  homeTeamBadge: homeBadge,
                  awayTeamBadge: awayBadge,
                };
              })
            );
            allMatches.push(...leagueMatches);
          }
        }
      } catch (err) {
        console.error(`Error fetching league ${leagueId}:`, err);
      }
    }

    // If no real data, use mock data
    return allMatches.length > 0 ? allMatches : fetchMockMatches();
  };

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const matchesData = await fetchAllMatches();
        
        if (matchesData.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }
  
        // Filter only upcoming matches and remove duplicates
        const upcomingMatches = matchesData
          .filter(match => match.timestamp > Math.floor(Date.now() / 1000))
          .filter((match, index, self) => 
            index === self.findIndex(m => m.id === match.id)
          )
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, 20);
  
        setMatches(upcomingMatches);
      } catch (err) {
        console.error('Error loading matches:', err);
        setError('Could not load matches at this time');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
  
    loadMatches();
  
    // Refresh less frequently since we're okay with empty states
    const interval = setInterval(loadMatches, 60 * 60 * 1000); // 60 minutes
    return () => clearInterval(interval);
  }, []);

  return { matches, loading, error };
};