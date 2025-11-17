import { useState, useEffect } from 'react';

export interface Competition {
  id: string;
  name: string;
  code: string;
  emblem: string;
}

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitions = async (): Promise<Competition[]> => {
    try {
      const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/all_leagues.php');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.leagues) {
        return getDefaultCompetitions();
      }

      // Filter for popular football leagues
      const popularLeagues = data.leagues.filter((league: any) => 
        ['English Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'].includes(league.strLeague)
      );

      return popularLeagues.map((league: any) => ({
        id: league.idLeague,
        name: league.strLeague,
        code: league.strLeagueShort || league.strLeague.substring(0, 3).toUpperCase(),
        emblem: league.strBadge || '',
      }));
    } catch (err) {
      console.error('Error fetching competitions:', err);
      return getDefaultCompetitions();
    }
  };

  const getDefaultCompetitions = (): Competition[] => {
    return [
      { id: '4328', name: 'English Premier League', code: 'EPL', emblem: '' },
      { id: '4335', name: 'La Liga', code: 'LLA', emblem: '' },
      { id: '4331', name: 'Bundesliga', code: 'BUN', emblem: '' },
      { id: '4332', name: 'Serie A', code: 'SA', emblem: '' },
      { id: '4334', name: 'Ligue 1', code: 'FL1', emblem: '' },
    ];
  };

  useEffect(() => {
    const loadCompetitions = async () => {
      setLoading(true);
      try {
        const comps = await fetchCompetitions();
        setCompetitions(comps);
      } catch (err) {
        setError('Failed to load competitions');
        console.error('Error loading competitions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, []);

  return { competitions, loading, error };
};