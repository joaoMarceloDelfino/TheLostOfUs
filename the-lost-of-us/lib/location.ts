export type LocationCoordinates = {
    latitude: number;
    longitude: number;
};

export type LocationWithLabel = LocationCoordinates & {
    label?: string | null;
};

const reverseGeocodeCache = new Map<string, string>();

function toCacheKey(location: LocationCoordinates): string {
    return `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
}

export function hasValidCoordinates(location?: LocationCoordinates | null): location is LocationCoordinates {
    return Boolean(
        location &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude)
    );
}

export function formatLocationLabel(location?: LocationCoordinates | null): string {
    if (!hasValidCoordinates(location)) {
        return "Local não informado";
    }

    return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

export function formatLocationDisplay(location?: LocationWithLabel | null): string {
    if (!hasValidCoordinates(location)) {
        return "Local não informado";
    }

    const label = location.label?.trim();
    if (label) {
        return label;
    }

    return formatLocationLabel(location);
}

export async function reverseGeocodeLocation(location: LocationCoordinates): Promise<string | null> {
    const cacheKey = toCacheKey(location);
    const cached = reverseGeocodeCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        if (typeof window !== "undefined") {
            const response = await fetch(`/api/location/reverse?lat=${encodeURIComponent(String(location.latitude))}&lng=${encodeURIComponent(String(location.longitude))}`);
            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { label?: string | null };
            const label = data.label?.trim();
            if (label) {
                reverseGeocodeCache.set(cacheKey, label);
                return label;
            }

            return null;
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(location.latitude))}&lon=${encodeURIComponent(String(location.longitude))}`,
            {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "the-lost-of-us/1.0",
                    "Referer": "http://localhost",
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json() as { display_name?: string | null };
        const label = data.display_name?.trim();
        if (label) {
            reverseGeocodeCache.set(cacheKey, label);
            return label;
        }
    } catch {
        return null;
    }

    return null;
}