import Input from '@mui/joy/Input';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import { ChangeEvent, useState } from 'react';
import Typography from '@mui/joy/Typography';
import { getDecklistById } from '../../services/decklist.service';

export default function Search() {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');

  const validateUrl = (url: string) => {
    const pattern = /^https:\/\/www\.moxfield\.com\/decks\/[A-Za-z0-9_-]+$/;
    return pattern.test(url);
  };

  const handleDecklist = async () => {
    setIsLoading(true);
    setServerErrorMessage('');

    const valid = validateUrl(inputValue);
    setIsValid(valid);
    if (valid) {
      const id = inputValue.split('/').pop()?.toString();
      if (id) {
        try {
          const decklist = await getDecklistById(id);
          console.log(decklist);
        } catch (err: any) {
          setServerErrorMessage(err.message);
          setIsValid(false);
        }
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsValid(true);
    setInputValue(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        margin: '0 auto',
        pt: 4,
      }}
    >
      <Input
        autoFocus
        placeholder="Enter a Moxfield link to unlock powerful data"
        startDecorator={<SearchIcon />}
        endDecorator={
          <Button onClick={handleDecklist} loading={isLoading}>
            Analyze
          </Button>
        }
        value={inputValue}
        onChange={handleInputChange}
        sx={{
          flexGrow: 1,
          bgcolor: 'background.level1',
          maxWidth: '700px',
          width: '100%',
          '--Input-radius': '10px',
        }}
        color={isValid ? 'neutral' : 'danger'}
      />
      {!isValid && (
        <Typography color="danger" sx={{ mt: 1, textAlign: 'center' }}>
          {serverErrorMessage ? (
            serverErrorMessage
          ) : (
            <>
              Please enter a valid Moxfield deck URL in the format:
              <br />
              <code>https://www.moxfield.com/decks/[DECK_ID]</code>
            </>
          )}
        </Typography>
      )}
    </Box>
  );
}
