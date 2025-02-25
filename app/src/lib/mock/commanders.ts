export const mockCommanderData = {
    id: "1",
    name: "Kinnan, Bonder Prodigy",
    colorIdentity: "{W}{U}{B}{R}{G}",
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
            id: "3.1",
            name: "Cephalid Coliseum",
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
        },
        {
            id: "6",
            name: "Tezzeret the Seeker",
            manaCost: "{3}{U}{U}",
            type: "Legendary Planeswalker - Tezzeret",
            inclusion: 87.2,
            winRate: 24.7,
            drawRate: 12.2
        },
        {
            id: "7",
            name: "Invasion of Ikoria",
            manaCost: "{X}{G}{G}",
            type: "Battle - Siege",
            inclusion: 87.2,
            winRate: 24.7,
            drawRate: 12.2
        },
        {
            id: "8",
            name: "Transmute Artifact",
            manaCost: "{U}{U}",
            type: "Sorcery",
            inclusion: 88.1,
            winRate: 24.8,
            drawRate: 11.9
        }
    ],
    matchups: {
        best: {
            name: "Najeela, the Blade-Blossom",
            winRate: 32.8
        },
        worst: {
            name: "Tymna, The Weaver // Thrasios, Triton Hero",
            winRate: 6.4
        }
    },
    charts: {
        winRate: [
            { date: "2025-02-17", winRate: 28.4 },
            { date: "2025-02-10", winRate: 26.8 },
            { date: "2025-02-03", winRate: 27.9 },
            { date: "2025-01-27", winRate: 25.2 },
            { date: "2025-01-20", winRate: 23.8 },
            { date: "2025-01-13", winRate: 24.7 },
            { date: "2025-01-06", winRate: 26.1 },
            { date: "2024-12-30", winRate: 27.5 },
            { date: "2024-12-23", winRate: 28.3 },
            { date: "2024-12-16", winRate: 26.2 },
            { date: "2024-12-09", winRate: 24.1 },
            { date: "2024-12-02", winRate: 22.0 }
        ],
        popularity: [
            { date: "2025-02-17", popularity: 7.8 },
            { date: "2025-02-10", popularity: 7.2 },
            { date: "2025-02-03", popularity: 6.9 },
            { date: "2025-01-27", popularity: 6.5 },
            { date: "2025-01-20", popularity: 6.2 },
            { date: "2025-01-13", popularity: 5.8 },
            { date: "2025-01-06", popularity: 5.5 },
            { date: "2024-12-30", popularity: 5.1 },
            { date: "2024-12-23", popularity: 4.8 },
            { date: "2024-12-16", popularity: 4.4 },
            { date: "2024-12-09", popularity: 4.1 },
            { date: "2024-12-02", popularity: 3.7 }
        ],
        winRateBySeat: [
            { position: "1", winRate: 28.5 },
            { position: "2", winRate: 24.2 },
            { position: "3", winRate: 22.8 },
            { position: "4", winRate: 21.5 }
        ],
        winRateByCut: [
            { cut: "Swiss", winRate: 26.4 },
            { cut: "Top 16", winRate: 23.8 },
            { cut: "Top 8", winRate: 22.1 },
            { cut: "Top 4", winRate: 20.5 },
            { cut: "Finals", winRate: 18.9 }
        ]
    },
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
        },
        {
            id: "3",
            name: "Player Three",
            games: 42,
            wins: 13,
            winRate: 31.0,
            top4s: 2
        },
        {
            id: "4",
            name: "Player Four",
            games: 35,
            wins: 10,
            winRate: 28.6,
            top4s: 1
        },
        {
            id: "5",
            name: "Player Five",
            games: 30,
            wins: 8,
            winRate: 26.7,
            top4s: 1
        }
    ],
    topDecklists: [
        {
            id: "dl1",
            name: "Turbo Kinnan",
            player: "Player One",
            tournament: "cEDH Weekly Championship",
            date: "2025-02-17",
            standing: 1,
            winRate: 75.0
        },
        {
            id: "dl2",
            name: "Fast Combo Kinnan",
            player: "Player Two",
            tournament: "February Showdown",
            date: "2025-02-03",
            standing: 2,
            winRate: 71.4
        },
        {
            id: "dl3",
            name: "Control Kinnan",
            player: "Player Three",
            tournament: "Winter Championship 2025",
            date: "2025-01-15",
            standing: 1,
            winRate: 70.0
        },
        {
            id: "dl4",
            name: "Midrange Kinnan",
            player: "Player Four",
            tournament: "December Finals",
            date: "2024-12-20",
            standing: 3,
            winRate: 66.7
        },
        {
            id: "dl5",
            name: "Adaptive Kinnan",
            player: "Player Five",
            tournament: "October Championship",
            date: "2024-10-15",
            standing: 2,
            winRate: 65.5
        }
    ]
};
