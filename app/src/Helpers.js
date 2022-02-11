export function truncateBase58(base58) {
    return base58.slice(0, 4) + '..' + base58.slice(-4);
}

export async function copyToClipBoard(text) {
    await navigator.clipboard.writeText(text);
}
