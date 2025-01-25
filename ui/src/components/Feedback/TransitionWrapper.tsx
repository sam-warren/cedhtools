import { ReactNode, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

interface TransitionWrapperProps {
  loading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
  transitionDuration?: number;
  className?: string;
}

const TransitionWrapper = ({
  loading = false,
  skeleton,
  children,
  transitionDuration = ANIMATION_DURATIONS.transitionDuration,
  className = '',
}: TransitionWrapperProps) => {
  const nodeRef = useRef(null);

  return (
    <div className={className}>
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={loading ? 'loading' : 'content'}
          nodeRef={nodeRef}
          timeout={transitionDuration}
          classNames={{
            enter: 'opacity-0',
            enterActive: 'opacity-100 transition-opacity',
            exit: 'opacity-0 transition-opacity',
          }}
        >
          <div ref={nodeRef}>
            {loading ? skeleton : children}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
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
