import type { DocumentData } from "firebase/firestore";
import type { Address, LocationGPS } from "../../features/costumers/domain/business/entities/Address";

export function AddressToDocument(
    address: Address
): DocumentData {
    return {
        address: address.address,
        neighborhood: address.neighborhood,
        stratum: address.stratum,
        city: address.city,

        ...(address.locationGPS
            ? {
                locationGPS: LocationGPSToDocument(address.locationGPS),
            }
            : {}),
    };
}

export function DocumentToAddress(
    document: DocumentData
): Address {
    return {
        address: document.address,
        neighborhood: document.neighborhood,
        stratum: document.stratum,
        city: document.city,

        ...(document.locationGPS
            ? {
                locationGPS: DocumentToLocationGPS(document.locationGPS),
            }
            : {}),
    };
}

export function LocationGPSToDocument(
    locationGPS: LocationGPS
): DocumentData {
    return {
        ...(locationGPS.coordinates !== undefined && {
            coordinates: locationGPS.coordinates,
        }),

        ...(locationGPS.latitude !== undefined && {
            latitude: locationGPS.latitude,
        }),

        ...(locationGPS.longitude !== undefined && {
            longitude: locationGPS.longitude,
        }),

        ...(locationGPS.accuracy !== undefined && {
            accuracy: locationGPS.accuracy,
        }),

        ...(locationGPS.provider !== undefined && {
            provider: locationGPS.provider,
        }),
    };
}

export function DocumentToLocationGPS(
    document: DocumentData
): LocationGPS {
    return {
        coordinates: document.coordinates,
        latitude: document.latitude,
        longitude: document.longitude,
        accuracy: document.accuracy,
        provider: document.provider,
    };
}