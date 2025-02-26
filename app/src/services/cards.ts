'use server';

import type {
    Card,
    CardCommanderPerformance,
    CommanderCardAnalysis
} from "@/types/entities/cards";
import { CardReference, CommanderReference, TimeSeriesDataPoint } from "@/types/entities/common";
import { createMockListFetcher, withErrorHandling, withCache } from "../lib/utils/api-utils";

/**
 * MOCK DATA GENERATORS
 * These functions generate mock data for development and testing purposes.
 * In a production environment, these would be replaced with actual API calls.
 */

/**
 * Generates a mock Card entity with random properties
 * @param id - Unique identifier for the card
 * @param name - Display name for the card
 * @returns A Card entity with mock data
 */
const generateMockCard = (id: string, name: string): Card => ({
    id,
    name,
    colorIdentity: ['R', 'G', 'B'][Math.floor(Math.random() * 3)],
    typeLine: "Legendary Creature — Human Wizard",
    manaCost: "{2}{R}{G}",
    cmc: 4,
    image: `https://cards.scryfall.io/normal/front/0/0/${id}.jpg`,
    oracleText: "When this creature enters the battlefield, draw a card.",
    commanderLegality: 'legal',
    legalityUpdatedAt: new Date().toISOString()
});

/**
 * Generates an array of mock Card entities
 * @param count - Number of cards to generate
 * @returns Array of Card entities
 */
const generateMockCards = (count: number): Card[] => {
    return Array.from({ length: count }, (_, i) => {
        const id = `mock-card-${i}`;
        const name = `Mock Card ${i}`;
        return generateMockCard(id, name);
    });
};

/**
 * Generates mock performance data for a specific card-commander pairing
 * @param cardId - ID of the card
 * @param cardName - Name of the card
 * @param commanderId - ID of the commander
 * @param commanderName - Name of the commander
 * @returns CardCommanderPerformance data
 */
const generateMockCardCommanderPerformance = (
    cardId: string,
    cardName: string,
    commanderId: string,
    commanderName: string
): CardCommanderPerformance => {
    const totalDecksWithCommander = Math.floor(Math.random() * 1000) + 100;
    const decksWithCard = Math.floor(Math.random() * totalDecksWithCommander);
    const gamesPlayed = Math.floor(Math.random() * 500) + 50;
    const wins = Math.floor(Math.random() * gamesPlayed);
    const draws = Math.floor(Math.random() * (gamesPlayed - wins));
    const losses = gamesPlayed - wins - draws;

    const inclusionRate = decksWithCard / totalDecksWithCommander;
    const winRate = wins / gamesPlayed;
    const drawRate = draws / gamesPlayed;

    return {
        card: {
            id: cardId,
            name: cardName
        },
        commander: {
            id: commanderId,
            name: commanderName
        },
        totalDecksWithCommander,
        decksWithCard,
        wins,
        draws,
        losses,
        gamesPlayed,
        inclusionRate,
        winRate,
        drawRate
    };
};

/**
 * Generates mock card analysis data for a commander
 * @param commanderId ID of the commander
 * @param commanderName Name of the commander
 * @returns CommanderCardAnalysis data showing cards played with this commander, high performers, and unique cards
 */
const generateMockCommanderCardAnalysis = (commanderId: string, commanderName: string): CommanderCardAnalysis => {
    const generateCardList = (count: number, prefix: string) =>
        Array.from({ length: count }, (_, i) => ({
            card: {
                id: `${prefix}-card-${i}`,
                name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Card ${i}`
            },
            inclusion: Math.random(),
            winRate: Math.random()
        }));

    return {
        commander: {
            id: commanderId,
            name: commanderName
        },
        cards: generateCardList(15, 'card').map(item => ({
            card: item.card,
            inclusion: item.inclusion,
            winRate: item.winRate,
            drawRate: Math.random() * 0.2
        })),
        highPerformers: generateCardList(5, 'performer').map(item => ({
            card: item.card,
            inclusion: item.inclusion,
            winRate: item.winRate,
            winRateDiff: item.winRate - 0.5
        })),
        uniqueCards: generateCardList(5, 'unique').map(item => ({
            card: item.card,
            inclusion: item.inclusion,
            globalInclusion: item.inclusion * 0.3,
            ratio: 1 / (0.3)
        }))
    };
};

/**
 * Generates time series data for card performance metrics
 * @param days - Number of days in the time series
 * @param base - Base value for the data points
 * @param variance - Maximum variance from the base value
 * @returns Array of TimeSeriesDataPoint for the specified time period
 */
const generateTimeSeriesData = (days: number, base: number, variance: number): TimeSeriesDataPoint[] => {
    const results: TimeSeriesDataPoint[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        results.push({
            timestamp: date.toISOString().split('T')[0],
            value: base + (Math.random() * variance * 2 - variance)
        });
    }

    return results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

// Mock data for cards
const mockCards = generateMockCards(20);

/**
 * API SERVICE FUNCTIONS
 * These functions provide access to card data throughout the application.
 * Each function follows a consistent pattern of creating a fetcher, adding caching,
 * and adding error handling before executing the request.
 */

/**
 * Retrieves a list of all cards
 * @returns Promise resolving to an array of Card entities
 */
export const getCards = async (): Promise<Card[]> => {
    const cardsFetcher = await createMockListFetcher<Card>(mockCards);
    const cachedFetcher = await withCache(cardsFetcher);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher();
};

/**
 * Retrieves a specific card by ID
 * @param id - The ID of the card to retrieve
 * @returns Promise resolving to a Card entity
 */
export const getCardById = async (id: string): Promise<Card> => {
    const cardFetcher = async (cardId: string): Promise<Card> => {
        const card = mockCards.find(c => c.id === cardId);
        if (!card) {
            return generateMockCard(cardId, `Card ${cardId}`);
        }
        return card;
    };

    const cachedFetcher = await withCache(cardFetcher as (...args: unknown[]) => Promise<unknown>);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher(id) as Card;
};

/**
 * Retrieves performance data for a specific card-commander pairing
 * @param cardId - The ID of the card
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to CardCommanderPerformance data
 */
export const getCardCommanderPerformance = async (cardId: string, commanderId: string): Promise<CardCommanderPerformance> => {
    const performanceFetcher = async (cId: string, cmId: string): Promise<CardCommanderPerformance> => {
        return generateMockCardCommanderPerformance(
            cId,
            `Card ${cId}`,
            cmId,
            `Commander ${cmId}`
        );
    };

    const cachedFetcher = await withCache(performanceFetcher as (...args: unknown[]) => Promise<unknown>);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher(cardId, commanderId) as CardCommanderPerformance;
};

/**
 * Retrieves card analysis for a specific commander
 * @param commanderId ID of the commander
 * @returns Promise resolving to CommanderCardAnalysis showing cards played with this commander, high performers, and unique cards
 */
export const getCommanderCardAnalysis = async (commanderId: string): Promise<CommanderCardAnalysis> => {
    const analysisFetcher = async (cmId: string): Promise<CommanderCardAnalysis> => {
        return generateMockCommanderCardAnalysis(cmId, `Commander ${cmId}`);
    };

    const cachedFetcher = await withCache(analysisFetcher as (...args: unknown[]) => Promise<unknown>);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher(commanderId) as CommanderCardAnalysis;
};

/**
 * Retrieves historical win rate data for a specific card
 * @param cardId - The ID of the card
 * @param commanderId - Optional ID of a commander to filter results
 * @returns Promise resolving to time series data of win rates
 */
export const getCardWinRateHistory = async (cardId: string, commanderId?: string): Promise<TimeSeriesDataPoint[]> => {
    const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
        return generateTimeSeriesData(90, 0.5, 0.15);
    };

    const cachedFetcher = await withCache(historyFetcher);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher();
};

/**
 * Retrieves historical inclusion data for a specific card
 * @param cardId - The ID of the card
 * @param commanderId - Optional ID of a commander to filter results
 * @returns Promise resolving to time series data of inclusion rates
 */
export const getCardInclusionHistory = async (cardId: string, commanderId?: string): Promise<TimeSeriesDataPoint[]> => {
    const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
        return generateTimeSeriesData(90, 0.3, 0.1);
    };

    const cachedFetcher = await withCache(historyFetcher);
    const errorHandledFetcher = await withErrorHandling(cachedFetcher);
    return await errorHandledFetcher();
}; 