export const commanderStackStyles = {
  container: {
    position: 'relative',
    height: 400,
    mb: 2,
  },
  card: (index: number) => ({
    position: 'absolute',
    top: index === 0 ? 0 : '8%',
    left: 0,
    zIndex: 1,
    transform: `translateY(${index === 0 ? 0 : '2%'})`,
    '&:hover': {
      zIndex: 3,
    },
  }),
  singleCardContainer: {
    position: 'relative',
    mb: 2,
  },
} as const;