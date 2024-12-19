import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';
import { ChangeEvent, useState } from 'react';
import { getDecklistById } from '../../services';
import { useNavigate } from 'react-router-dom';
import { IApiResponse } from '../../types/api';
import { IMoxfieldDeck } from '../../types';

export default function Search() {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');

  const navigate = useNavigate();

  const validateUrl = (url: string): boolean => {
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
          const response: IApiResponse<IMoxfieldDeck> = await getDecklistById(id);
          if (response.success) {
            navigate(`/deck/${response.data.publicId}`); // Redirect to deck page
          } else {
            setServerErrorMessage(response.error);
            setIsValid(false);
          }
        } catch (err: any) {
          setServerErrorMessage(err.message || 'An error occurred');
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
        placeholder="Enter a Moxfield deck link to unlock powerful data"
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
