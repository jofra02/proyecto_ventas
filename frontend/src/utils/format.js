/**
 * Formats pack stock quantity into a compact "Xp + Yu" format.
 * @param {number} totalQty - Total quantity in packs (can be fractional)
 * @param {number} unitsPerPack - Number of individual units per pack
 * @returns {string} Formatted string like "7p + 4u", "2p", or "10u"
 */
export const formatPackStock = (totalQty, unitsPerPack) => {
    if (!unitsPerPack || unitsPerPack <= 1) return `${Math.round(totalQty)}`;

    // totalQty is in packs (e.g., 7.666 packs)
    // We convert everything to units first to avoid floating point issues
    const totalUnits = Math.round(totalQty * unitsPerPack);
    const packs = Math.floor(totalUnits / unitsPerPack);
    const units = totalUnits % unitsPerPack;

    if (packs > 0 && units > 0) {
        return `${packs}p + ${units}u`;
    } else if (packs > 0) {
        return `${packs}p`;
    } else {
        return `${units}u`;
    }
};
