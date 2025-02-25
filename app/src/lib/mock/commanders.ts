export const mockCommanderData = {
    id: "1",
    name: "Kinnan, Bonder Prodigy",
    colorIdentity: "{W}{U}{B}{R}{G}",
    commanders: [
        {
            id: "1",
            standing: 1,
            name: "Kraum, Ludevic's Opus / Tymna the Weaver",
            colorIdentity: "{W}{U}{B}{R}",
            winRate: 21.9,
            drawRate: 14.5,
            entries: 519,
            metaShare: 7.88
        },
        {
            id: "2",
            standing: 2,
            name: "Thrasios, Triton Hero / Tymna the Weaver",
            colorIdentity: "{W}{U}{B}{G}",
            winRate: 22.8,
            drawRate: 14.9,
            entries: 393,
            metaShare: 5.96
        },
        {
            id: "3",
            standing: 3,
            name: "Kinnan, Bonder Prodigy",
            colorIdentity: "{U}{G}",
            winRate: 21.5,
            drawRate: 13.2,
            entries: 287,
            metaShare: 4.36
        },
        {
            id: "4",
            standing: 4,
            name: "Rograkhh, Son of Rohgahh / Silas Renn, Seeker Adept",
            colorIdentity: "{U}{B}{R}",
            winRate: 20.5,
            drawRate: 13.2,
            entries: 329,
            metaShare: 4.99
        },
        {
            id: "5",
            standing: 5,
            name: "Sisay, Weatherlight Captain",
            colorIdentity: "{W}{U}{B}{R}{G}",
            winRate: 20.1,
            drawRate: 12.9,
            entries: 288,
            metaShare: 4.37
        }
    ],
    stats: {
        tournamentWins: 15,
        top4s: 45,
        top10s: 89,
        top16s: 156,
        totalGames: 1250,
        wins: 312,
        draws: 125,
        winRate: 24.96,
        drawRate: 10,
        entries: {
            total: 450,
            uniquePlayers: 178
        }
    },
    cards: [
        {
            id: "1",
            name: "Basalt Monolith",
            manaCost: "{3}",
            type: "Artifact",
            inclusion: 99.8,
            winRate: 26.1,
            drawRate: 9.4
        },
        {
            id: "2",
            name: "Force of Will",
            manaCost: "{3}{U}{U}",
            type: "Instant",
            inclusion: 98.4,
            winRate: 27.2,
            drawRate: 10.1
        },
        {
            id: "3",
            name: "Gaea's Cradle",
            manaCost: "",
            type: "Land",
            inclusion: 97.5,
            winRate: 26.8,
            drawRate: 9.9
        },
        {
            id: "4",
            name: "Enduring Vitality",
            manaCost: "{1}{G}{G}",
            type: "Creature - Elk Glimmer",
            inclusion: 56.5,
            winRate: 28.4,
            drawRate: 8.1
        },
        {
            id: "5",
            name: "Pemmin's Aura",
            manaCost: "{2}{U}",
            type: "Enchantment",
            inclusion: 36.2,
            winRate: 20.1,
            drawRate: 12.2
        }
    ],
    matchups: [
        {
            id: "2",
            name: "Thrasios, Triton Hero / Tymna the Weaver",
            colorIdentity: "{W}{U}{B}{G}",
            winRate: 48.2,
            drawRate: 12.5,
            gamesPlayed: 85
        },
        {
            id: "4",
            name: "Rograkhh, Son of Rohgahh / Silas Renn, Seeker Adept",
            colorIdentity: "{U}{B}{R}",
            winRate: 52.1,
            drawRate: 10.2,
            gamesPlayed: 64
        }
    ],
    topPilots: [
        {
            id: "1",
            name: "Player One",
            games: 45,
            wins: 15,
            winRate: 33.3,
            top4s: 3
        },
        {
            id: "2",
            name: "Player Two",
            games: 38,
            wins: 12,
            winRate: 31.6,
            top4s: 2
        }
    ],
    winRateHistory: [
        { date: "2023-01", value: 22.5 },
        { date: "2023-02", value: 23.1 },
        { date: "2023-03", value: 24.2 },
        { date: "2023-04", value: 24.8 },
        { date: "2023-05", value: 25.1 }
    ],
    popularityHistory: [
        { date: "2023-01", value: 3.8, total: 245 },
        { date: "2023-02", value: 4.1, total: 267 },
        { date: "2023-03", value: 4.3, total: 298 },
        { date: "2023-04", value: 4.5, total: 312 },
        { date: "2023-05", value: 4.7, total: 342 }
    ],
    winRateBySeat: [
        { position: 1, winRate: 26.4 },
        { position: 2, winRate: 24.8 },
        { position: 3, winRate: 23.5 },
        { position: 4, winRate: 22.1 }
    ],
    winRateByCut: [
        { cut: "Top 4", winRate: 28.6 },
        { cut: "Top 8", winRate: 26.2 },
        { cut: "Top 16", winRate: 24.1 },
        { cut: "Swiss", winRate: 22.3 }
    ],
    cardWinRateHistory: [
        { date: "2023-01", value: 24.5 },
        { date: "2023-02", value: 25.1 },
        { date: "2023-03", value: 26.2 },
        { date: "2023-04", value: 26.8 },
        { date: "2023-05", value: 27.1 }
    ],
    cardPopularityHistory: [
        { date: "2023-01", value: 82.8, total: 203 },
        { date: "2023-02", value: 84.1, total: 225 },
        { date: "2023-03", value: 85.3, total: 254 },
        { date: "2023-04", value: 86.5, total: 270 },
        { date: "2023-05", value: 87.7, total: 300 }
    ],
    topDecklists: [
        {
            id: "1",
            name: "Kinnan Combo",
            author: "Jane Smith",
            date: "2023-05-15",
            tournament: "CommandFest Seattle",
            placement: "1st Place"
        },
        {
            id: "2",
            name: "Turbo Kinnan",
            author: "John Doe",
            date: "2023-04-22",
            tournament: "cEDH Championship",
            placement: "Top 4"
        }
    ]
};
