const axios = require("axios");
require("dotenv").config();

// config
const { STEAM_ID, STEAM_API_KEY } = process.env;

console.log("[ENV] STEAM_ID length:", STEAM_ID?.length);
console.log("[ENV] STEAM_API_KEY length:", STEAM_API_KEY?.length);

const STEAM_HOST = "https://api.steampowered.com";

const SteamDataTypes = Object.freeze({
    PROFILE: 'profile',
    ACTIVITY: 'activity',
    OWNED_GAMES: 'owned',
});

const SteamInterfaces = Object.freeze({
    USER: '/ISteamUser/GetPlayerSummaries/v0002/',
    RECENT_GAMES: '/IPlayerService/GetRecentlyPlayedGames/v0001/',
    OWNED_GAMES:'/IPlayerService/GetOwnedGames/v0001/',

})

class InvalidSteamRequestTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidSteamRequestTypeError";
    }
}

/**
 * A generic function to make requests to the Steam API.
 * @param {string} interfacePath - The API interface path from SteamInterfaces.
 * @param {object} params - Additional query parameters for the request.
 * @returns {Promise<object>} The data from the API response.
 */
const fetchFromSteam = async (interfacePath, params = {}) => {

    const queryParams = new URLSearchParams({
        key: STEAM_API_KEY,
        format: 'json',
        ...params, // Spread any additional params
    });

    const url = `${STEAM_HOST}${interfacePath}?${queryParams}`;

    try {
        console.log(`[Steam API] Fetching from: ${interfacePath}`);
        const response = await axios.get(url);

        return response.data.response;
    } catch (error) {
        console.error(`[Steam API] Error fetching from ${url}:`, error.message);
        throw new Error('Failed to fetch data from Steam API.');

    }
};


const _getProfile = async () => {
    const data = await fetchFromSteam(SteamInterfaces.USER, {steamids: STEAM_ID});
    
    if (!data || !data.players || data.players.length === 0) {
        throw new Error("Could not find player data.");
    }
    
    const player = data.players[0];

    // for reference only. it makes sense to use it in the frontend.
    const personaStateMap = {
        0: 'Offline',
        1: 'Online',
        2: 'Busy',
        3: 'Away',
        4: 'Snooze',
        5: 'Looking to trade',
        6: 'Looking to play',
    };

    const status = {
        state: player.personastate || 'Unknown',
        inGame: !!player.gameextrainfo,
        game: player.gameextrainfo || null,
        gameId: player.gameid || null
    };

    return {
        personaName: player.personaname,
        lastLogoff: player.lastlogoff,
        avatar: player.avatar,
        avatarMedium: player.avatarmedium,
        avatarFull: player.avatarfull,
        profileUrl: player.profileurl,
        timeCreated: player.timecreated,
        status: status,
    };
};

const _getRecentGames = async () => {
    const data = await fetchFromSteam(SteamInterfaces.RECENT_GAMES, {steamid: STEAM_ID});

    // Handle the case where the user has no recently played games
    if (data.total_count === 0 || !data.games) {
        return {
            totalCount: 0,
            games: [],
            message: "No recently played games found."
        };
    }
    return {
        totalCount: data.total_count,
        games: data.games,
    };
};


const _getOwnedGames = async () => {

    // add `include_appinfo: true` to get names and icons
    const data = await fetchFromSteam(SteamInterfaces.OWNED_GAMES, {
        steamid: STEAM_ID,
        include_appinfo: true,
        include_played_free_games: true,
    });

    if (data.game_count === 0 || !data.games) {
        return {
            gameCount: 0,
            games: [],
        };
    }

    const sortedGames = data.games.sort((a, b) => b.playtime_forever - a.playtime_forever);

    return {
        gameCount: data.game_count,
        games: sortedGames,
    };
};

/**
 * Main function to get data based on a type.
 * @param {string} type - The type of data to fetch (from SteamDataTypes).
 * @returns {Promise<object>} The requested data.
 */
const getData = async (type) => {
    // Validate the type against our enum
    if (!Object.values(SteamDataTypes).includes(type)) {
        throw new InvalidSteamRequestTypeError(`Invalid "type". Must be one of: ${Object.values(SteamDataTypes).join(', ')}`);
    }

    switch (type) {
        case SteamDataTypes.PROFILE:
            return _getProfile();
        case SteamDataTypes.ACTIVITY:
            return _getRecentGames();
        case SteamDataTypes.OWNED_GAMES:
            return _getOwnedGames();
    }
};

module.exports = {
    getData,
    SteamDataTypes, 
    InvalidSteamRequestTypeError 
};

