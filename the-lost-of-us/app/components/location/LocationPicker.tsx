"use client";

import { useEffect, useMemo, useState } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { formatLocationDisplay, reverseGeocodeLocation, type LocationCoordinates } from "@/lib/location";

type LocationPickerProps = {
    value: LocationCoordinates | null;
    onChange: (value: LocationCoordinates | null) => void;
};

const defaultCenter: LatLngExpression = [-14.235, -51.9253];

const pinIcon = divIcon({
    className: "",
    html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#d94a38;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
});

function MapInteraction({ value, onChange }: LocationPickerProps) {
    const map = useMapEvents({
        click(event) {
            onChange({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    useEffect(() => {
        if (value) {
            map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 14), {
                animate: true,
            });
        }
    }, [map, value]);

    return value ? <Marker position={[value.latitude, value.longitude]} icon={pinIcon} /> : null;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [locationLabel, setLocationLabel] = useState<string>("Clique no mapa para marcar a localização.");

    const center = useMemo<LatLngExpression>(() => {
        if (value) {
            return [value.latitude, value.longitude];
        }

        return defaultCenter;
    }, [value]);

    useEffect(() => {
        let isActive = true;

        if (!value) {
            setLocationLabel("Clique no mapa para marcar a localização.");
            return;
        }

        setLocationLabel("Resolvendo endereço...");

        reverseGeocodeLocation(value)
            .then((label) => {
                if (!isActive) {
                    return;
                }

                setLocationLabel(
                    label?.trim()
                        ? label
                        : formatLocationDisplay(value)
                );
            })
            .catch(() => {
                if (!isActive) {
                    return;
                }

                setLocationLabel(formatLocationDisplay(value));
            });

        return () => {
            isActive = false;
        };
    }, [value]);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid #d1d5db" }}>
                <MapContainer
                    center={center}
                    zoom={value ? 14 : 4}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInteraction value={value} onChange={onChange} />
                </MapContainer>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>
                    {locationLabel}
                </p>
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "#2a5ea8",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    Limpar
                </button>
            </div>
        </div>
    );
}