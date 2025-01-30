import React from 'react';
import { useRouter } from 'next/router';

const PlayerPage: React.FC = () => {
    const router = useRouter();
    const { playerId } = router.query;

    return (
        <div>
            <h1>Player Page</h1>
            <p>Player ID: {playerId}</p>
        </div>
    );
};

export default PlayerPage;