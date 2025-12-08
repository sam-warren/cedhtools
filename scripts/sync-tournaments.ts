#!/usr/bin/env npx tsx
/**
 * Tournament Sync Script
 * 
 * Fetches tournament data from TopDeck.gg and syncs to Supabase.
 * Run with: npx tsx scripts/sync-tournaments.ts
 * 
 * Environment variables required:
 * - TOPDECK_API_KEY: TopDeck.gg API key
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/db/types';
import { validateDecklistWithRetry } from '../lib/scrollrack';
import {
  generateWeeklyRanges,
  listTournaments
} from '../lib/topdeck';
import type {
  DeckObj,
  StandingPlayer,
  TopdeckTournament,
  TournamentRound
} from '../lib/topdeck/types';
import {
  getCommanderCards,
  getMainboardCards,
  normalizeCommanderName
} from '../lib/topdeck/types';

// TODO: We should consider adding back Moxfield into our pipeline. We want to target collecting data we already get from Topdeck. In the case that the decklist is a Moxifeld URL, we should draft / scaffold out a service to make a request to Moxfield to get deck data. We can validate it with scrollrack and store the data in the same manner we currently store data.

// ============================================
// Configuration
// ============================================

const START_DATE = new Date('2025-05-19T00:00:00Z');

// ============================================
// Text Normalization
// ============================================

/**
 * Normalize text by replacing special characters with ASCII equivalents.
 * This prevents duplicate records due to inconsistent character encoding
 * (e.g., curly apostrophes vs straight apostrophes).
 * TODO: Review this functionality to see if it is still necessary
 */
function normalizeText(text: string): string {
  return text
    // Normalize apostrophes (curly to straight)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Normalize quotes (curly to straight)
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Normalize dashes (em/en dash to hyphen)
    .replace(/[\u2013\u2014]/g, '-')
    // Normalize ellipsis
    .replace(/\u2026/g, '...')
    // Trim whitespace
    .trim();
}

// ============================================
// Supabase Client
// ============================================

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// ============================================
// Helper Types
// ============================================

// TODO: Should these live in a separate types file?
interface SyncStats {
  tournamentsProcessed: number;
  tournamentsSkipped: number;
  playersCreated: number;
  commandersCreated: number;
  cardsCreated: number;
  entriesCreated: number;
  gamesCreated: number;
  decklistsValidated: number;
  decklistsValid: number;
  decklistsInvalid: number;
  errors: string[];
}

interface PlayerCache {
  [topdeckId: string]: number; // Maps topdeck ID to our player ID
}

interface CommanderCache {
  [name: string]: number; // Maps commander name to our commander ID
}

interface CardCache {
  [name: string]: number; // Maps card name to our card ID
}

// ============================================
// Sync Logic
// ============================================

async function upsertPlayer(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  topdeckId: string | null,
  cache: PlayerCache
): Promise<number> {
  // Check cache first
  if (topdeckId && cache[topdeckId]) {
    return cache[topdeckId];
  }
  
  // Try to find existing player by topdeck ID
  if (topdeckId) {
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('topdeck_id', topdeckId)
      .single();
    
    if (existing) {
      cache[topdeckId] = existing.id;
      return existing.id;
    }
  }
  
  // Insert new player
  const { data, error } = await supabase
    .from('players')
    .insert({ name, topdeck_id: topdeckId })
    .select('id')
    .single();
  
  if (error) {
    // Handle unique constraint violation - try to find by topdeck_id again
    // TODO: Explain why this is necessary
    if (error.code === '23505' && topdeckId) {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('topdeck_id', topdeckId)
        .single();
      
      if (existing) {
        cache[topdeckId] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }
  
  if (topdeckId) {
    cache[topdeckId] = data.id;
  }
  return data.id;
}

async function upsertCommander(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  cache: CommanderCache
): Promise<number> {
  // Normalize name to prevent duplicates from encoding differences
  const normalizedName = normalizeText(name);
  
  // Check cache first
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  
  // Try to find existing
  const { data: existing } = await supabase
    .from('commanders')
    .select('id')
    .eq('name', normalizedName)
    .single();
  
  if (existing) {
    cache[normalizedName] = existing.id;
    return existing.id;
  }
  
  // Insert new commander with normalized name
  // TODO: Calculate color_id from commander names
  const { data, error } = await supabase
    .from('commanders')
    .insert({ name: normalizedName, color_id: '' })
    .select('id')
    .single();
  
  if (error) {
    // TODO: Explain why this is necessary
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('commanders')
        .select('id')
        .eq('name', normalizedName)
        .single();
      
      if (existing) {
        cache[normalizedName] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }
  
  cache[normalizedName] = data.id;
  return data.id;
}

async function upsertCard(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  oracleId: string | null,
  cache: CardCache
): Promise<number> {
  // Normalize name to prevent duplicates from encoding differences
  const normalizedName = normalizeText(name);
  
  // Check cache first
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  
  // Try to find existing
  const { data: existing } = await supabase
    .from('cards')
    .select('id')
    .eq('name', normalizedName)
    .single();
  
  if (existing) {
    cache[normalizedName] = existing.id;
    return existing.id;
  }
  
  // Insert new card with normalized name
  const { data, error } = await supabase
    .from('cards')
    .insert({ name: normalizedName, oracle_id: oracleId })
    .select('id')
    .single();
  
  if (error) {
    // TODO: Explain why this is necessary
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('cards')
        .select('id')
        .eq('name', normalizedName)
        .single();
      
      if (existing) {
        cache[normalizedName] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }
  
  cache[normalizedName] = data.id;
  return data.id;
}

async function processTournament(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  tournament: TopdeckTournament,
  playerCache: PlayerCache,
  commanderCache: CommanderCache,
  cardCache: CardCache,
  stats: SyncStats
): Promise<void> {
  // 1. Upsert tournament
  const tournamentDate = new Date(tournament.startDate * 1000);
  
  const { data: tournamentRow, error: tournamentError } = await supabase
    .from('tournaments')
    .upsert({
      tid: tournament.TID,
      name: tournament.tournamentName,
      tournament_date: tournamentDate.toISOString(), // TODO: Ensure this correctly handles tournament dates in UTC timestamp (seconds) from raw data
      size: tournament.standings.length,
      swiss_rounds: tournament.swissNum,
      top_cut: tournament.topCut,
    }, { onConflict: 'tid' })
    .select('id')
    .single();
  
  if (tournamentError) throw tournamentError;
  const tournamentId = tournamentRow.id;
  
  // 2. Process standings (create players, commanders, entries)
  const entryMap = new Map<string, number>(); // Maps player topdeck ID to entry ID
  
  for (let i = 0; i < tournament.standings.length; i++) {
    const standing = tournament.standings[i];
    
    // Create/get player
    const playerId = await upsertPlayer(
      supabase,
      standing.name,
      standing.id,
      playerCache
    );
    
    // Create/get commander
    let commanderId: number | null = null;
    const commanderName = normalizeCommanderName(standing.deckObj);
    if (commanderName) {
      commanderId = await upsertCommander(supabase, commanderName, commanderCache);
      stats.commandersCreated++;
    }
    
    // Create entry
    const { data: entryRow, error: entryError } = await supabase
      .from('entries')
      .upsert({
        tournament_id: tournamentId,
        player_id: playerId,
        commander_id: commanderId,
        standing: i + 1,
        wins_swiss: standing.winsSwiss,
        wins_bracket: standing.winsBracket,
        losses_swiss: standing.lossesSwiss,
        losses_bracket: standing.lossesBracket,
        draws: standing.draws,
        decklist: standing.decklist,
      }, { onConflict: 'tournament_id,player_id' })
      .select('id')
      .single();
    
    if (entryError) throw entryError;
    
    const entryId = entryRow.id;
    if (standing.id) {
      entryMap.set(standing.id, entryId);
    }
    stats.entriesCreated++;
    
    // Validate decklist if available
    /**
     * TODO: This is currently broken and is causing decklists to be marked as invalid even though they are valid. For example:
     * Incorrectly marked as invalid: ~~Commanders~~\n1 Najeela, the Blade-Blossom\n\n~~Mainboard~~\n1 Abrupt Decay\n1 An Offer You Can\'t Refuse\n1 Ancient Tomb\n1 Arcane Signet\n1 Badlands\n1 Bayou\n1 Birds of Paradise\n1 Bloodstained Mire\n1 Bloom Tender\n1 Borne Upon a Wind\n1 Boseiju, Who Endures\n1 Brain Freeze\n1 Chatterfang, Squirrel General\n1 Chrome Mox\n1 City of Brass\n1 Command Tower\n1 Crop Rotation\n1 Cyclonic Rift\n1 Dark Ritual\n1 Deadly Rollick\n1 Deathrite Shaman\n1 Deflecting Swat\n1 Delighted Halfling\n1 Demonic Tutor\n1 Derevi, Empyrial Tactician\n1 Diabolic Intent\n1 Eladamri\'s Call\n1 Enlightened Tutor\n1 Esper Sentinel\n1 Exotic Orchard\n1 Fellwar Stone\n1 Fierce Guardianship\n1 Finale of Devastation\n1 Fire Covenant\n1 Flooded Strand\n1 Flusterstorm\n1 Force of Negation\n1 Force of Vigor\n1 Force of Will\n1 Frenzied Baloth\n1 Gaea\'s Cradle\n1 Gamble\n1 Gemstone Caverns\n1 Gifts Ungiven\n1 Grand Abolisher\n1 Ignoble Hierarch\n1 Intuition\n1 Knuckles the Echidna\n1 Kutzil, Malamet Exemplar\n1 Lion\'s Eye Diamond\n1 Lively Dirge\n1 Lotho, Corrupt Shirriff\n1 Lotus Petal\n1 Mana Confluence\n1 Mana Vault\n1 Marsh Flats\n1 Mental Misstep\n1 Mindbreak Trap\n1 Misty Rainforest\n1 Mox Amber\n1 Mox Diamond\n1 Mystic Remora\n1 Nature\'s Rhythm\n1 Noble Hierarch\n1 Pact of Negation\n1 Plateau\n1 Polluted Delta\n1 Professional Face-Breaker\n1 Ragavan, Nimble Pilferer\n1 Ranger-Captain of Eos\n1 Red Elemental Blast\n1 Rev, Tithe Extractor\n1 Rhystic Study\n1 Samut, Vizier of Naktamun\n1 Savannah\n1 Scalding Tarn\n1 Scrubland\n1 Sevinne\'s Reclamation\n1 Silence\n1 Simian Spirit Guide\n1 Smothering Tithe\n1 Sol Ring\n1 Starting Town\n1 Swords to Plowshares\n1 Taiga\n1 Tainted Pact\n1 Thassa\'s Oracle\n1 Tinder Wall\n1 Tropical Island\n1 Tundra\n1 Underground Sea\n1 Underworld Breach\n1 Vampiric Tutor\n1 Verdant Catacombs\n1 Voice of Victory\n1 Volcanic Island\n1 Warren Soultrader\n1 Windswept Heath\n1 Wooded Foothills\n
     * Incorrectly marked as invalid: ~~Commanders~~\n1 Magda, Brazen Outlaw\n\n~~Mainboard~~\n1 Abrade\n1 Adaptive Automaton\n1 Agatha\'s Soul Cauldron\n1 Ancient Tomb\n1 Arena of Glory\n1 Axgard Cavalry\n1 Barkform Harvester\n1 Battered Golem\n1 Blood Moon\n1 Bloodfire Dwarf\n1 Bloodline Pretender\n1 Bottle-Cap Blast\n1 Cavern of Souls\n1 Chaos Warp\n1 Chrome Mox\n1 City of Traitors\n1 Clock of Omens\n1 Clown Car\n1 Command Beacon\n1 Damping Sphere\n1 Deflecting Swat\n1 Delayed Blast Fireball\n1 Dwarven Armorer\n1 Dwarven Bloodboiler\n1 Dwarven Grunt\n1 Dwarven Scorcher\n1 Emergence Zone\n1 Flare of Duplication\n1 Galvanic Blast\n1 Gamble\n1 Gemstone Caverns\n1 Ghostfire Slice\n1 Glóin, Dwarf Emissary\n1 God-Pharaoh\'s Statue\n1 Gogo, Mysterious Mime\n1 Grafdigger\'s Cage\n1 Great Furnace\n1 High-Speed Hoverbike\n1 Holdout Settlement\n1 Jeska\'s Will\n1 Kavaron, Memorial World\n1 Knuckles the Echidna\n1 Lifecraft Engine\n1 Lightning Bolt\n1 Liquimetal Torque\n1 Lotus Petal\n1 Magda, the Hoardmaster\n1 Mana Vault\n1 Maskwood Nexus\n1 Metallic Mimic\n8 Mountain\n1 Mox Diamond\n1 Mox Opal\n1 Mutavault\n1 Peter Parker\'s Camera\n1 Pinnacle Monk // Mystic Peak\n1 Portal to Phyrexia\n1 Professional Face-Breaker\n1 Pyretic Ritual\n1 Pyroblast\n1 Pyrokinesis\n1 Ragavan, Nimble Pilferer\n1 Red Elemental Blast\n1 Rite of Flame\n1 Roaming Throne\n1 Sculpting Steel\n1 Sensei\'s Divining Top\n1 Shatterskull Smashing // Shatterskull, the Hammer Pass\n1 Shinka, the Bloodsoaked Keep\n1 Simian Spirit Guide\n1 Smuggler\'s Copter\n1 Sol Ring\n1 Spark Mage\n1 Springleaf Drum\n1 Sudden Shock\n1 Sundering Eruption // Volcanic Fissure\n1 Survivors\' Encampment\n1 Talon Gates of Madara\n1 Tezzeret, Cruel Captain\n1 The One Ring\n1 Three Tree Mascot\n1 Tibalt\'s Trickery\n1 Torpor Orb\n1 Treasure Vault\n1 Twinshot Sniper\n1 Universal Automaton\n1 Unlicensed Hearse\n1 Untimely Malfunction\n1 Urza\'s Cave\n1 Urza\'s Saga\n1 Vexing Bauble\n1 Xorn\n\n
     * Correctly marked as valid: ~~Commanders~~\n1 Thrasios, Triton Hero\n1 Yoshimaru, Ever Faithful\n\n~~Mainboard~~\n1 Ancient Tomb\n1 Archivist of Oghma\n1 Arid Mesa\n1 Avacyn’s Pilgrim\n1 Biomancer’s Familiar\n1 Birds of Paradise\n1 Boseiju, Who Endures\n1 Breeding Pool\n1 Brightglass Gearhulk\n1 Candelabra of Tawnos\n1 Chain of Vapor\n1 Chord of Calling\n1 Chrome Mox\n1 City of Brass\n1 Cloud of Faeries\n1 Command Tower\n1 Crop Rotation\n1 Cryptolith Rite\n1 Delighted Halfling\n1 Derevi, Empyrial Tactician\n1 Deserted Temple\n1 Devoted Druid\n1 Eldritch Evolution\n1 Emergence Zone\n1 Emiel the Blessed\n1 Enduring Vitality\n1 Enlightened Tutor\n1 Esper Sentinel\n1 Eternal Witness\n1 Exotic Orchard\n1 Expedition Map\n1 Faerie Mastermind\n1 Fierce Guardianship\n1 Finale of Devastation\n1 Flesh Duplicate\n1 Flooded Strand\n1 Flusterstorm\n1 Force of Negation\n1 Force of Will\n1 Frantic Search\n1 Gaea’s Cradle\n1 Gemstone Caverns\n1 Gilded Drake\n1 Grand Abolisher\n1 Green Sun’s Zenith\n1 Hallowed Fountain\n1 Kutzil, Malamet Exemplar\n1 Lotus Petal\n1 Mana Confluence\n1 Mana Vault\n1 Marsh Flats\n1 Mental Misstep\n1 Minamo, School at Water’s Edge\n1 Mindbreak Trap\n1 Mistrise Village\n1 Misty Rainforest\n1 Mockingbird\n1 Mox Amber\n1 Mox Diamond\n1 Mystic Remora\n1 Nature’s Chosen\n1 Nature’s Rhythm\n1 Neoform\n1 Noble Hierarch\n1 Oboro Breezecaller\n1 Otawara, Soaring City\n1 Path to Exile\n1 Phyrexian Metamorph\n1 Polluted Delta\n1 Ranger-Captain of Eos\n1 Rhystic Study\n1 Savannah\n1 Scalding Tarn\n1 Seedborn Muse\n1 Silence\n1 Smothering Tithe\n1 Snap\n1 Sol Ring\n1 Sowing Mycospawn\n1 Springheart Nantuko\n1 Springleaf Drum\n1 Swan Song\n1 Swift Reconfiguration\n1 Swords to Plowshares\n1 Sylvan Scrying\n1 Talon Gates of Madara\n1 Temple Garden\n1 The One Ring\n1 Training Grounds\n1 Tropical Island\n1 Tundra\n1 Verdant Catacombs\n1 Voice of Victory\n1 Wargate\n1 Weathered Wayfarer\n1 Wild Growth\n1 Windswept Heath\n1 Wooded Foothills\n\n\nImported from https://moxfield.com/decks/JBcSQAY_7E-N7uwUaoMvTQ
     * Correctly marked as valid: ~~Commanders~~\n1 Etali, Primal Conqueror // Etali, Primal Sickness\n\n~~Mainboard~~\n1 _____ Goblin\n1 Abrade\n1 Ancient Tomb\n1 Arcane Signet\n1 Arid Mesa\n1 Birds of Paradise\n1 Birgi, God of Storytelling // Harnfel, Horn of Bounty\n1 Blasphemous Act\n1 Boseiju, Who Endures\n1 Bridgeworks Battle // Tanglespan Bridgeworks\n1 Carpet of Flowers\n1 Cavern of Souls\n1 Chandra, Flameshaper\n1 Chrome Mox\n1 City of Brass\n1 City of Traitors\n1 Cloudstone Curio\n1 Command Tower\n1 Commercial District\n1 Cursed Mirror\n1 Deflecting Swat\n1 Delighted Halfling\n1 Destiny Spinner\n1 Dualcaster Mage\n1 Eldrazi Confluence\n1 Eldritch Evolution\n1 Electroduplicate\n1 Elvish Spirit Guide\n1 Emrakul, the Promised End\n1 Eternal Witness\n1 Exotic Orchard\n1 Fellwar Stone\n1 Food Chain\n1 Force of Vigor\n1 Forest\n1 Fyndhorn Elves\n1 Gamble\n1 Gemstone Caverns\n1 Goblin Anarchomancer\n1 Grim Monolith\n1 Grove of the Burnwillows\n1 Heat Shimmer\n1 Hellkite Courser\n1 Herigast, Erupting Nullkite\n1 Hunting Velociraptor\n1 Imperial Recruiter\n1 Jaxis, the Troublemaker\n1 Jeska’s Will\n1 Karplusan Forest\n1 Lightning Bolt\n1 Llanowar Elves\n1 Lotus Petal\n1 Mana Confluence\n1 Mana Vault\n1 Metamorphosis\n1 Misty Rainforest\n1 Molten Duplication\n1 Mountain\n1 Noxious Revival\n1 Orcish Lumberjack\n1 Panharmonicon\n1 Pinnacle Monk // Mystic Peak\n1 Pyretic Ritual\n1 Pyroblast\n1 Ragavan, Nimble Pilferer\n1 Red Elemental Blast\n1 Rending Volley\n1 Rionya, Fire Dancer\n1 Rite of Flame\n1 Roaming Throne\n1 Ruby Medallion\n1 Sanctum Weaver\n1 Scalding Tarn\n1 Seething Song\n1 Shifting Woodland\n1 Simian Spirit Guide\n1 Snow-Covered Forest\n1 Snow-Covered Mountain\n1 Sol Ring\n1 Spire Garden\n1 Squee, the Immortal\n1 Stomping Ground\n1 Sylvan Library\n1 Taiga\n1 Talisman of Impulse\n1 Tarnished Citadel\n1 Temur Sabertooth\n1 The One Ring\n1 Tinder Wall\n1 Treasonous Ogre\n1 Twinflame\n1 Urza’s Saga\n1 Utopia Sprawl\n1 Veil of Summer\n1 Verdant Catacombs\n1 Wandering Archaic // Explore the Vastlands\n1 Wild Growth\n1 Wooded Foothills\n1 Worldly Tutor\n\n\nImported from https://moxfield.com/decks/8nbAjG8jpEutCsP6FcPZag
     * Could this be something to do with how the scrollrack API handles the moxfield URL at the end? Does it require it? Need to investigate at https://scrollrack.topdeck.gg/ and https://scrollrack.topdeck.gg/docs.
     * Calling the API: curl -X POST https://scrollrack.topdeck.gg/api/validate \
      -H "Content-Type: application/json" \
      -d '{
        "game": "mtg",
        "format": "commander",
        "list": "~~Commanders~~\n1 Atraxa, Praetors Voice\n\n~~Mainboard~~\n99 Forest"
      }'
     * Decklist formatting: 
      ~~Mainboard~~
      4 Lightning Bolt
      20 Mountain

      ~~Sideboard~~
      3 Blood Moon
     * 
     * Integration Example:
     * async function validateDeck(decklist) {
        const response = await fetch('https://scrollrack.topdeck.gg/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: 'mtg',
            format: 'modern',
            list: decklist
          })
        });
        
        return await response.json();
      }
     * Example decklist from Scrollrack: 
      ~~Commanders~~
      1 Rograkh, Son of Rohgahh
      1 Silas Renn, Seeker Adept
      ~~Mainboard~~
      1 Mana Crypt
      1 Ad Nauseam
      1 Ancient Tomb
      1 Arcane Signet
      1 Arid Mesa
      1 Badlands
      1 Beseech the Mirror
      1 Birgi, God of Storytelling
      1 Blood Crypt
      1 Bloodstained Mire
      1 Borne Upon a Wind
      1 Brain Freeze
      1 Brainstorm
      1 Cabal Ritual
      1 Chain of Vapor
      1 Chrome Mox
      1 City of Brass
      1 City of Traitors
      1 Command Tower
      1 Culling the Weak
      1 Dark Ritual
      1 Daze
      1 Defense Grid
      1 Deflecting Swat
      1 Demonic Consultation
      1 Demonic Counsel
      1 Demonic Tutor
      1 Diabolic Intent
      1 Fierce Guardianship
      1 Final Fortune
      1 Flare of Duplication
      1 Flooded Strand
      1 Flusterstorm
      1 Force of Will
      1 Gamble
      1 Gemstone Caverns
      1 Gitaxian Probe
      1 Grim Monolith
      1 Grim Tutor
      1 Grinding Station
      1 Imperial Seal
      1 Infernal Plunge
      1 Jeska's Will
      1 Last Chance
      1 Lion's Eye Diamond
      1 Lotus Petal
      1 Mana Vault
      1 Marsh Flats
      1 Mental Misstep
      1 Mindbreak Trap
      1 Misty Rainforest
      1 Mnemonic Betrayal
      1 Mox Amber
      1 Mox Diamond
      1 Mox Opal
      1 Mystic Remora
      1 Mystical Tutor
      1 Necrodominance
      1 Necropotence
      1 Orcish Bowmasters
      1 Otawara, Soaring City
      1 Pact of Negation
      1 Paradise Mantle
      1 Phyrexian Tower
      1 Polluted Delta
      1 Praetor's Grasp
      1 Pyroblast
      1 Ragavan, Nimble Pilferer
      1 Rhystic Study
      1 Rite of Flame
      1 Scalding Tarn
      1 Simian Spirit Guide
      1 Snap
      1 Sol Ring
      1 Springleaf Drum
      1 Steam Vents
      1 Tainted Pact
      1 Talisman of Creativity
      1 Talisman of Dominance
      1 Talisman of Indulgence
      1 Thassa's Oracle
      1 Timetwister
      1 Undercity Sewers
      1 Underground Sea
      1 Underworld Breach
      1 Valley Floodcaller
      1 Vampiric Tutor
      1 Verdant Catacombs
      1 Vexing Bauble
      1 Volcanic Island
      1 Warrior's Oath
      1 Watery Grave
      1 Wheel of Fortune
      1 Wheel of Misfortune
      1 Windfall
      1 Wishclaw Talisman
      1 Wooded Foothills
      1 Yawgmoth's Will

      ~~Sideboard~~
      Bold Plagiarist

      Response from this query:
      {
        "valid": false,
        "errors": [
          "Use of Illegal Card: Mana Crypt"
        ],
        "decklist": "",
        "deckObj": {}
      }
      Correctly marked as invalid due to use of illegal card: Mana Crypt

      Endpoint to get images for decklist: https://scrollrack.topdeck.gg/api/image
      Response from this query:
      {
  "valid": true,
  "errors": [],
  "decklist": "~~Commanders~~\n1 Rograkh, Son of Rohgahh\n1 Silas Renn, Seeker Adept\n\n~~Mainboard~~\n1 Ad Nauseam\n1 Ancient Tomb\n1 Arcane Signet\n1 Arid Mesa\n1 Badlands\n1 Beseech the Mirror\n1 Birgi, God of Storytelling\n1 Blood Crypt\n1 Bloodstained Mire\n1 Borne Upon a Wind\n1 Brain Freeze\n1 Brainstorm\n1 Cabal Ritual\n1 Chain of Vapor\n1 Chrome Mox\n1 City of Brass\n1 City of Traitors\n1 Command Tower\n1 Culling the Weak\n1 Dark Ritual\n1 Daze\n1 Defense Grid\n1 Deflecting Swat\n1 Demonic Consultation\n1 Demonic Counsel\n1 Demonic Tutor\n1 Diabolic Intent\n1 Fierce Guardianship\n1 Final Fortune\n1 Flare of Duplication\n1 Flooded Strand\n1 Flusterstorm\n1 Force of Will\n1 Gamble\n1 Gemstone Caverns\n1 Gitaxian Probe\n1 Grim Monolith\n1 Grim Tutor\n1 Grinding Station\n1 Imperial Seal\n1 Infernal Plunge\n1 Jeska's Will\n1 Last Chance\n1 Lion's Eye Diamond\n1 Lotus Petal\n1 Mana Crypt\n1 Mana Vault\n1 Marsh Flats\n1 Mental Misstep\n1 Mindbreak Trap\n1 Misty Rainforest\n1 Mnemonic Betrayal\n1 Mox Amber\n1 Mox Diamond\n1 Mox Opal\n1 Mystic Remora\n1 Mystical Tutor\n1 Necrodominance\n1 Necropotence\n1 Orcish Bowmasters\n1 Otawara, Soaring City\n1 Pact of Negation\n1 Paradise Mantle\n1 Phyrexian Tower\n1 Polluted Delta\n1 Praetor's Grasp\n1 Pyroblast\n1 Ragavan, Nimble Pilferer\n1 Rhystic Study\n1 Rite of Flame\n1 Scalding Tarn\n1 Simian Spirit Guide\n1 Snap\n1 Sol Ring\n1 Springleaf Drum\n1 Steam Vents\n1 Tainted Pact\n1 Talisman of Creativity\n1 Talisman of Dominance\n1 Talisman of Indulgence\n1 Thassa's Oracle\n1 Timetwister\n1 Undercity Sewers\n1 Underground Sea\n1 Underworld Breach\n1 Valley Floodcaller\n1 Vampiric Tutor\n1 Verdant Catacombs\n1 Vexing Bauble\n1 Volcanic Island\n1 Warrior's Oath\n1 Watery Grave\n1 Wheel of Fortune\n1 Wheel of Misfortune\n1 Windfall\n1 Wishclaw Talisman\n1 Wooded Foothills\n1 Yawgmoth's Will\n\n",
  "deckObj": {
    "Commanders": [
      {
        "id": "584cee10-f18c-4633-95cc-f2e7a11841ac",
        "count": 1,
        "imgUrl": "https://images.topdeck.gg/game-images/mtg/584cee10-f18c-4633-95cc-f2e7a11841ac.webp",
        "PrimeType": "Creature",
        "CMC": 0,
        "name": "Rograkh, Son of Rohgahh"
      },
      {
        "id": "0dc78b1e-581e-4f28-bf35-e2082553d6a9",
        "count": 1,
        "imgUrl": "https://images.topdeck.gg/game-images/mtg/0dc78b1e-581e-4f28-bf35-e2082553d6a9.webp",
        "PrimeType": "Creature",
        "CMC": 3,
        "name": "Silas Renn, Seeker Adept"
      }
    ],
    "Mainboard": [
      {
        "id": "981b0e21-e5e6-4a1e-bfde-679d56623f7f",
        "count": 1,
        "imgUrl": "https://images.topdeck.gg/game-images/mtg/981b0e21-e5e6-4a1e-bfde-679d56623f7f.webp",
        "PrimeType": "Instant",
        "CMC": 5,
        "name": "Ad Nauseam"
      },
      {
        "id": "23467047-6dba-4498-b783-1ebc4f74b8c2",
        "count": 1,
        "imgUrl": "https://images.topdeck.gg/game-images/mtg/23467047-6dba-4498-b783-1ebc4f74b8c2.webp",
        "PrimeType": "Land",
        "CMC": 0,
        "name": "Ancient Tomb"
      },
      (...)
     */
    
    if (standing.decklist) {
      try {
        const validationResult = await validateDecklistWithRetry(standing.decklist);
        stats.decklistsValidated++;
        
        if (validationResult) {
          const isValid = validationResult.valid;
          if (isValid) {
            stats.decklistsValid++;
          } else {
            stats.decklistsInvalid++;
          }
          
          // Update entry with validation result
          await supabase
            .from('entries')
            .update({ decklist_valid: isValid })
            .eq('id', entryId);
        }
        // If validationResult is null (API failed), decklist_valid remains NULL
      } catch {
        // Validation error - leave decklist_valid as NULL
        // Don't throw - we don't want to fail the entire sync for validation issues
      }
      
      // Small delay between validation calls to be nice to scrollrack API
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Process decklist
    if (standing.deckObj) {
      await processDeck(supabase, entryId, standing.deckObj, cardCache, stats);
    }
  }
  
  // 3. Process rounds/games for seat position tracking
  await processRounds(
    supabase,
    tournamentId,
    tournament.rounds,
    tournament.standings,
    playerCache,
    entryMap,
    stats
  );
  
  stats.tournamentsProcessed++;
}

async function processDeck(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  entryId: number,
  deckObj: DeckObj,
  cardCache: CardCache,
  stats: SyncStats
): Promise<void> {
  // Get all cards (mainboard + commanders)
  const mainboardCards = getMainboardCards(deckObj);
  const commanderCards = getCommanderCards(deckObj);
  const allCards = [...mainboardCards, ...commanderCards];
  
  for (const card of allCards) {
    const cardId = await upsertCard(supabase, card.name, card.oracleId, cardCache);
    stats.cardsCreated++;
    
    // Insert decklist item (ignore conflicts)
    await supabase
      .from('decklist_items')
      .upsert({
        entry_id: entryId,
        card_id: cardId,
        quantity: card.count,
      }, { onConflict: 'entry_id,card_id', ignoreDuplicates: true });
  }
}

async function processRounds(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  tournamentId: number,
  rounds: TournamentRound[],
  standings: StandingPlayer[],
  playerCache: PlayerCache,
  entryMap: Map<string, number>,
  stats: SyncStats
): Promise<void> {
  // Build a map of player names to their topdeck IDs from standings
  const playerNameToId = new Map<string, string>();
  for (const standing of standings) {
    if (standing.id) {
      playerNameToId.set(standing.name.toLowerCase(), standing.id);
    }
  }
  
  for (const round of rounds) {
    const roundStr = String(round.round);
    
    for (const table of round.tables) {
      // Create game
      const isDraw = table.winner === 'Draw' || table.winner_id === 'Draw';
      
      // Find winner player ID
      let winnerPlayerId: number | null = null;
      if (!isDraw && table.winner) {
        const winnerTopdeckId = playerNameToId.get(table.winner.toLowerCase());
        if (winnerTopdeckId && playerCache[winnerTopdeckId]) {
          winnerPlayerId = playerCache[winnerTopdeckId];
        }
      }
      
      const { data: gameRow, error: gameError } = await supabase
        .from('games')
        .upsert({
          tournament_id: tournamentId,
          round: roundStr,
          table_number: table.table,
          winner_player_id: winnerPlayerId,
          is_draw: isDraw,
        }, { onConflict: 'tournament_id,round,table_number' })
        .select('id')
        .single();
      
      if (gameError) throw gameError;
      const gameId = gameRow.id;
      stats.gamesCreated++;
      
      // Create game_players with seat positions
      for (let seatIndex = 0; seatIndex < table.players.length; seatIndex++) {
        const player = table.players[seatIndex];
        if (!player.id) continue;
        
        // Get or create player
        const playerId = await upsertPlayer(
          supabase,
          player.name,
          player.id,
          playerCache
        );
        
        const entryId = entryMap.get(player.id) || null;
        
        await supabase
          .from('game_players')
          .upsert({
            game_id: gameId,
            player_id: playerId,
            entry_id: entryId,
            seat_position: seatIndex + 1, // 1-indexed seat position
          }, { onConflict: 'game_id,player_id', ignoreDuplicates: true });
      }
    }
  }
}

// ============================================
// Main Sync Function
// ============================================

async function syncTournaments(): Promise<SyncStats> {
  const supabase = createSupabaseAdmin();
  
  const stats: SyncStats = {
    tournamentsProcessed: 0,
    tournamentsSkipped: 0,
    playersCreated: 0,
    commandersCreated: 0,
    cardsCreated: 0,
    entriesCreated: 0,
    gamesCreated: 0,
    decklistsValidated: 0,
    decklistsValid: 0,
    decklistsInvalid: 0,
    errors: [],
  };
  
  // Shared caches (persist across weeks for efficiency)
  const playerCache: PlayerCache = {};
  const commanderCache: CommanderCache = {};
  const cardCache: CardCache = {};
  
  console.log('🚀 Starting tournament sync...');
  console.log(`📅 Processing tournaments from ${START_DATE.toISOString()} to now`);
  
  // Get all existing tournament IDs upfront
  const existingTids = new Set<string>();
  const { data: existingTournaments } = await supabase
    .from('tournaments')
    .select('tid');
  
  if (existingTournaments) {
    for (const t of existingTournaments as { tid: string }[]) {
      existingTids.add(t.tid);
    }
  }
  console.log(`📊 Found ${existingTids.size} existing tournaments in database`);
  
  // Process week by week (fetch → process → move on)
  const weeks = [...generateWeeklyRanges(START_DATE, new Date())];
  
  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📅 Week ${weekIdx + 1}/${weeks.length}: ${week.label}`);
    console.log('─'.repeat(50));
    
    // Fetch tournaments for this week
    let tournaments;
    try {
      tournaments = await listTournaments(week.start, week.end);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to fetch week: ${errorMsg}`);
      stats.errors.push(`Week ${week.label}: ${errorMsg}`);
      continue;
    }
    
    console.log(`  Found ${tournaments.length} tournaments`);
    
    // Filter to new tournaments only
    const newTournaments = tournaments.filter(t => !existingTids.has(t.TID));
    const skippedCount = tournaments.length - newTournaments.length;
    
    if (skippedCount > 0) {
      console.log(`  ⏭️ Skipping ${skippedCount} already processed`);
    }
    
    if (newTournaments.length === 0) {
      console.log(`  ✅ All tournaments already synced`);
      stats.tournamentsSkipped += skippedCount;
      continue;
    }
    
    console.log(`  🆕 Processing ${newTournaments.length} new tournaments...`);
    
    // Process each tournament in this week
    for (let i = 0; i < newTournaments.length; i++) {
      const tournament = newTournaments[i];
      
      // Skip tournaments without standings
      if (!tournament.standings || tournament.standings.length === 0) {
        stats.tournamentsSkipped++;
        continue;
      }
      
      try {
        process.stdout.write(`    [${i + 1}/${newTournaments.length}] ${tournament.tournamentName.substring(0, 40)}...`);
        
        await processTournament(
          supabase,
          tournament,
          playerCache,
          commanderCache,
          cardCache,
          stats
        );
        
        // Mark as processed so we don't retry on crash
        existingTids.add(tournament.TID);
        
        console.log(' ✅');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(` ❌ ${errorMsg}`);
        stats.errors.push(`${tournament.TID}: ${errorMsg}`);
      }
    }
    
    // Small delay between weeks to be nice to the API
    if (weekIdx < weeks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
  
  return stats;
}

// ============================================
// Entry Point
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('cEDH Tools - Tournament Sync');
  console.log('═'.repeat(60));
  
  try {
    const stats = await syncTournaments();
    
    console.log('\n' + '═'.repeat(60));
    console.log('Sync Complete!');
    console.log('═'.repeat(60));
    console.log(`Tournaments processed: ${stats.tournamentsProcessed}`);
    console.log(`Tournaments skipped:   ${stats.tournamentsSkipped}`);
    console.log(`Commanders created:    ${stats.commandersCreated}`);
    console.log(`Cards created:         ${stats.cardsCreated}`);
    console.log(`Entries created:       ${stats.entriesCreated}`);
    console.log(`Games created:         ${stats.gamesCreated}`);
    console.log(`Decklists validated:   ${stats.decklistsValidated}`);
    console.log(`  - Valid:             ${stats.decklistsValid}`);
    console.log(`  - Invalid:           ${stats.decklistsInvalid}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️ Errors (${stats.errors.length}):`);
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`  - ${error}`);
      }
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

