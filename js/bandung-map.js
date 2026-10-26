
/* ===== PEMBACA PETA BANDUNG ===== */

export async function loadBandungMap() {
    const response = await fetch("./data/bandung.geojson");

    if (!response.ok) {
        throw new Error("Data peta Bandung gagal dimuat");
    }

    const geojson = await response.json();

    const roads = [];

    for (const feature of geojson.features) {
        if (!feature.geometry) continue;

        const geometry = feature.geometry;

        if (geometry.type === "LineString") {
            roads.push(geometry.coordinates);
        }

        if (geometry.type === "MultiLineString") {
            roads.push(...geometry.coordinates);
        }
    }

    console.log("Jalur Bandung berhasil dimuat:", roads.length);

    return roads;
}
