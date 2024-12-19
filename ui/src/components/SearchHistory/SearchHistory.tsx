import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import { Link } from 'react-router-dom';
import Button from '@mui/joy/Button';
import { useSearchHistory } from '../../contexts/SearchHistoryContext';
import { ISearchHistoryEntry } from '../../types';

export default function SearchHistory() {
  const { searchHistory, clearSearchHistory } = useSearchHistory();

  if (searchHistory.length === 0) {
    return;
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '700px',
        mt: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography level="h4">recently searched decks</Typography>
        <Button
          variant="plain"
          color="neutral"
          onClick={() => clearSearchHistory()}
        >
          clear
        </Button>
      </Box>
      <List sx={{ gap: '2px' }}>
        {searchHistory.map((search: ISearchHistoryEntry) => (
          <ListItem key={search.publicId}>
            <ListItemButton
              component={Link}
              to={`/deck/${search.publicId}`}
              sx={{
                borderRadius: '8px',
              }}
            >
              <ListItemContent>
                <Typography level="body-sm" noWrap>
                  {search.name}
                </Typography>
                <Typography level="body-xs" color="neutral" noWrap>
                  {search.publicUrl}
                </Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
