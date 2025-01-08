import { ReactNode, useRef, useState, useEffect } from 'react';
import { Box, BoxProps } from '@mui/joy';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

interface TransitionWrapperProps extends Omit<BoxProps, 'children'> {
  loading?: boolean;
  skeleton?: ReactNode;
  staticRender?: boolean;
  children: ReactNode;
  transitionDuration?: number;
}

const TransitionWrapper = ({
  loading = false,
  skeleton,
  staticRender = false,
  children,
  transitionDuration = 300,
  sx,
  ...boxProps
}: TransitionWrapperProps) => {
  const contentRef = useRef(null);
  const skeletonRef = useRef(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [frozenChildren, setFrozenChildren] = useState<ReactNode>(null);
  const [frozenLoading, setFrozenLoading] = useState(loading);

  useEffect(() => {
    if (isInitialMount && !loading && staticRender) {
      // Lock in the children and loading state after initial mount
      setFrozenChildren(children);
      setFrozenLoading(false);
      setIsInitialMount(false);
    }
  }, [loading, children, staticRender, isInitialMount]);

  // Use frozen values if staticRender is true and we're past initial mount
  const effectiveLoading =
    !staticRender || isInitialMount ? loading : frozenLoading;
  const effectiveChildren =
    !staticRender || isInitialMount ? children : frozenChildren;

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
          key={effectiveLoading ? 'skeleton' : 'content'}
          nodeRef={effectiveLoading ? skeletonRef : contentRef}
          timeout={transitionDuration}
          classNames={{
            enter: 'transition-enter',
            enterActive: 'transition-enter-active',
            exit: 'transition-exit',
            exitActive: 'transition-exit-active',
          }}
        >
          {effectiveLoading && skeleton ? (
            <Box ref={skeletonRef}>{skeleton}</Box>
          ) : (
            <Box ref={contentRef}>{effectiveChildren}</Box>
          )}
        </CSSTransition>
      </SwitchTransition>
    </Box>
  );
};

interface SectionProps {
  when: boolean;
  children: ReactNode;
  sx?: BoxProps['sx'];
}

const Section = ({ when, children, sx }: SectionProps) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition
      in={when}
      nodeRef={nodeRef}
      timeout={300}
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
