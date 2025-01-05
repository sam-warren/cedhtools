export const commanderStackStyles = {
  container: {
    position: 'relative',
    height: 400,
    mb: 2,
  },
  card: (index: number, isTop: boolean) => ({
    position: 'absolute',
    top: index === 0 ? 0 : '8%',
    left: 0,
    zIndex: isTop ? 2 : 1,
    transition: 'all 0.1s ease-in-out',
    transform: `translateY(${index === 0 ? 0 : '2%'})`,
    '&:hover': {
      zIndex: 2,
    },
  }),
  singleCard: {
    mb: 2,
  },
} as const;
