import { Modal, ModalDialog, Button, Typography, Stack } from '@mui/joy';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorModalProps {
  message: string;
  onRetry: () => void;
  onClose: () => void;
  open: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  message,
  onRetry,
  onClose,
  open
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
        sx={{
          maxWidth: '400px',
          boxShadow: 'lg',
          border: '1px solid',
          borderColor: 'neutral.outlinedBorder'
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 40, 
            mb: 0, 
            alignSelf: 'center',
            color: 'danger.500'
          }} 
        />
        <Typography
          id="error-modal-title"
          level="title-lg"
          textAlign="center"
          mb={1}
          fontWeight="lg"
        >
          Something went wrong
        </Typography>
        <Typography
          id="error-modal-description"
          textAlign="center"
          mb={3}
          color="neutral"
        >
          {message}
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1.5}
          width="100%"
        >
          <Button
            variant="plain"
            color="neutral"
            startDecorator={<CloseIcon />}
            onClick={onClose}
            sx={{ flex: 1 }}
          >
            Dismiss
          </Button>
          <Button
            variant="soft"
            color="danger"
            startDecorator={<RefreshIcon />}
            onClick={onRetry}
            sx={{ flex: 1 }}
          >
            Try again
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

export default ErrorModal;