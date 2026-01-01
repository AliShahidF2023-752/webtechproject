// ELO Rating Calculation System
// Based on the standard chess ELO rating system with adjustments for sports

interface EloResult {
    player1NewRating: number
    player2NewRating: number
    player1Change: number
    player2Change: number
}

/**
 * Calculate expected score based on ratings
 * @param playerRating - The player's current rating
 * @param opponentRating - The opponent's rating
 * @returns Expected score between 0 and 1
 */
export function calculateExpectedScore(
    playerRating: number,
    opponentRating: number
): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

/**
 * Calculate new ELO ratings after a match
 * @param player1Rating - Current rating of player 1
 * @param player2Rating - Current rating of player 2
 * @param player1Won - Whether player 1 won (true) or player 2 won (false)
 * @param kFactor - K-factor for rating volatility (default: 32)
 * @returns Object with new ratings and rating changes
 */
export function calculateEloChange(
    player1Rating: number,
    player2Rating: number,
    player1Won: boolean,
    kFactor: number = 32
): EloResult {
    const expected1 = calculateExpectedScore(player1Rating, player2Rating)
    const expected2 = calculateExpectedScore(player2Rating, player1Rating)

    const actual1 = player1Won ? 1 : 0
    const actual2 = player1Won ? 0 : 1

    const change1 = Math.round(kFactor * (actual1 - expected1))
    const change2 = Math.round(kFactor * (actual2 - expected2))

    return {
        player1NewRating: player1Rating + change1,
        player2NewRating: player2Rating + change2,
        player1Change: change1,
        player2Change: change2
    }
}

/**
 * Get rating tier based on ELO rating
 * @param rating - Player's current rating
 * @returns Rating tier name
 */
export function getRatingTier(rating: number): string {
    if (rating < 1000) return 'Beginner'
    if (rating < 1200) return 'Novice'
    if (rating < 1400) return 'Intermediate'
    if (rating < 1600) return 'Advanced'
    if (rating < 1800) return 'Expert'
    if (rating < 2000) return 'Master'
    return 'Grandmaster'
}

/**
 * Get rating tier color for UI display
 * @param rating - Player's current rating
 * @returns CSS color value
 */
export function getRatingColor(rating: number): string {
    if (rating < 1000) return '#808080' // Gray
    if (rating < 1200) return '#00e676' // Green
    if (rating < 1400) return '#00d9ff' // Cyan
    if (rating < 1600) return '#40c4ff' // Blue
    if (rating < 1800) return '#e040fb' // Purple
    if (rating < 2000) return '#ffab40' // Orange
    return '#ff5252' // Red
}

/**
 * Calculate K-factor based on player experience
 * Newer players have higher K-factor for faster rating adjustments
 * @param totalGames - Total number of games played
 * @param currentRating - Current rating
 * @returns Adjusted K-factor
 */
export function getKFactor(totalGames: number, currentRating: number): number {
    if (totalGames < 10) return 40  // New players - high volatility
    if (totalGames < 30) return 32  // Developing players
    if (currentRating < 1400) return 32  // Lower rated players
    if (currentRating < 1800) return 24  // Intermediate players
    return 16  // Experienced high-rated players
}

/**
 * Check if two players are compatible for matching
 * @param rating1 - First player's rating
 * @param rating2 - Second player's rating
 * @param tolerance - Maximum rating difference allowed
 * @returns Whether the players can be matched
 */
export function arePlayersCompatible(
    rating1: number,
    rating2: number,
    tolerance: number = 200
): boolean {
    return Math.abs(rating1 - rating2) <= tolerance
}

/**
 * Calculate match quality score
 * Higher score means more balanced match
 * @param rating1 - First player's rating
 * @param rating2 - Second player's rating
 * @returns Quality score between 0 and 1
 */
export function calculateMatchQuality(
    rating1: number,
    rating2: number
): number {
    const ratingDiff = Math.abs(rating1 - rating2)
    // Perfect match at 0 diff, decreases as difference increases
    return Math.max(0, 1 - ratingDiff / 500)
}
