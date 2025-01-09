import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();

  const handleDecklist = async () => {
    const id = inputValue.split('/').pop()?.toString();
    navigate(`/deck/${id}`);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
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
        endDecorator={<Button onClick={handleDecklist}>Analyze</Button>}
        value={inputValue}
        onChange={handleInputChange}
        sx={{
          flexGrow: 1,
          bgcolor: 'background.level1',
          maxWidth: { xs: '100%', sm: '700px' },
          width: '100%',
          '--Input-radius': '10px',
        }}
        color={'neutral'}
      />
    </Box>
  );
}
