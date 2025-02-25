import type { Tournament } from "@/types/api/tournaments";

export const mockTournamentData: Tournament[] = [
    {
        id: "t123",
        name: "cEDH Weekly Championship",
        date: "2024-03-15",
        players: 64,
        swissRounds: 6,
        topCut: 8,
        winner: "John Smith",
        winningCommander: "Kinnan, Bonder Prodigy"
    },
    {
        id: "t124",
        name: "March Madness cEDH",
        date: "2024-03-10",
        players: 128,
        swissRounds: 7,
        topCut: 16,
        winner: "Jane Doe",
        winningCommander: "Najeela, the Blade-Blossom"
    },
    {
        id: "t125",
        name: "Winter Championship 2024",
        date: "2024-02-28",
        players: 96,
        swissRounds: 6,
        topCut: 8,
        winner: "Mike Johnson",
        winningCommander: "Tymna, The Weaver // Thrasios, Triton Hero"
    },
    {
        id: "t126",
        name: "Regional Qualifier #1",
        date: "2024-02-15",
        players: 48,
        swissRounds: 5,
        topCut: 8,
        winner: "Sarah Wilson",
        winningCommander: "Minsc & Boo, Timeless Heroes"
    },
    {
        id: "t127",
        name: "Monthly Championship",
        date: "2024-02-01",
        players: 72,
        swissRounds: 6,
        topCut: 8,
        winner: "David Brown",
        winningCommander: "Kraum // Tymna"
    }
];

