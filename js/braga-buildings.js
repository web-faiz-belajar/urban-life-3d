
export async function loadBragaBuildings() {
    const response = await fetch("../data/braga.geojson");

    if (!response.ok) {
        throw new Error("Data bangunan Braga gagal dimuat");
    }

    const geojson = await response.json();
    const buildings = [];

    for (const feature of geojson.features ?? []) {
        if (!feature.geometry) continue;

        if (
            feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon"
        ) {
            buildings.push(feature);
        }
    }

    console.log("Bangunan Braga dimuat:", buildings.length);

    return buildings;
}
