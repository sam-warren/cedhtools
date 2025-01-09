import { ReactNode, useRef } from 'react';
import { Box, BoxProps } from '@mui/joy';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

interface TransitionWrapperProps extends Omit<BoxProps, 'children'> {
  loading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
  transitionDuration?: number;
}

const TransitionWrapper = ({
  loading = false,
  skeleton,
  children,
  transitionDuration = ANIMATION_DURATIONS.transitionDuration,
  sx,
  ...boxProps
}: TransitionWrapperProps) => {
  const contentRef = useRef(null);
  const skeletonRef = useRef(null);

  return (
    <Box
      {...boxProps}
      className="transition-wrapper"
      sx={{
        position: 'relative',
        minHeight: skeleton ? '2rem' : 'auto',
        '& .transition-enter': {
          opacity: 0,
          transform: 'translateY(10px)',
        },
        '& .transition-enter-active': {
          opacity: 1,
          transform: 'translateY(0)',
          transition: `all ${transitionDuration}ms ease-in-out`,
        },
        '& .transition-exit': {
          opacity: 1,
          transform: 'translateY(0)',
        },
        '& .transition-exit-active': {
          opacity: 0,
          transform: 'translateY(10px)',
          transition: `all ${transitionDuration}ms ease-in-out`,
        },
        ...sx,
      }}
    >
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={loading ? 'skeleton' : 'content'}
          nodeRef={loading ? skeletonRef : contentRef}
          timeout={transitionDuration}
          classNames={{
            enter: 'transition-enter',
            enterActive: 'transition-enter-active',
            exit: 'transition-exit',
            exitActive: 'transition-exit-active',
          }}
        >
          {loading && skeleton ? (
            <Box ref={skeletonRef}>{skeleton}</Box>
          ) : (
            <Box ref={contentRef}>{children}</Box>
          )}
        </CSSTransition>
      </SwitchTransition>
    </Box>
  );
};

interface SectionProps {
  when: boolean;
  children: ReactNode;
  sectionTransitionDuration?: number;
  sx?: BoxProps['sx'];
}

const Section = ({
  when,
  children,
  sectionTransitionDuration = ANIMATION_DURATIONS.sectionTransitionDuration,
  sx,
}: SectionProps) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition
      in={when}
      nodeRef={nodeRef}
      timeout={sectionTransitionDuration}
      unmountOnExit
      classNames={{
        enter: 'section-enter',
        enterActive: 'section-enter-active',
        exit: 'section-exit',
        exitActive: 'section-exit-active',
      }}
    >
      <Box
        ref={nodeRef}
        className="transition-wrapper-section"
        sx={{
          '& .section-enter': {
            opacity: 0,
            transform: 'translateY(10px)',
            height: 0,
            overflow: 'hidden',
          },
          '& .section-enter-active': {
            opacity: 1,
            transform: 'translateY(0)',
            height: 'auto',
            overflow: 'hidden',
            transition: 'all 300ms ease-in-out',
          },
          '& .section-exit': {
            opacity: 1,
            transform: 'translateY(0)',
            height: 'auto',
            overflow: 'hidden',
          },
          '& .section-exit-active': {
            opacity: 0,
            transform: 'translateY(10px)',
            height: 0,
            overflow: 'hidden',
            transition: 'all 300ms ease-in-out',
          },
          ...sx,
        }}
      >
        <Box>{children}</Box>
      </Box>
    </CSSTransition>
  );
};

TransitionWrapper.Section = Section;
export default TransitionWrapper;
