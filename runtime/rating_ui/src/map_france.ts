import L from "leaflet";

// GeoJSON data for France's departments
const DEPARTMENTS_URL = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson";

// Style for the GeoJSON layer
function style(feature: any): L.PathOptions {
  return {
    fillColor: "#FFEDA0",
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.5,
  };
}

// Highlight feature on mouseover
function highlightFeature(e: L.LeafletMouseEvent): void {
  const layer = e.target as L.Path;
  layer.setStyle({
    weight: 2,
    color: "#c00000",
    dashArray: "",
    fillOpacity: 0.7,
  });

  layer.bringToFront();
}

// CHANGE: Added OnDepartmentClick callback to handle department clicks
// CHANGE: Added resetHighlight function to reset style on mouseout
// CHANGE: Added OnEachFeature function to bind events to each department feature
// CHANGE: Fetch GeoJSON data and add it to the map with appropriate styling and event handlers
export function mountMap(container: HTMLElement, OnDepartmentClick: (code: string) => void): void {
  const map = L.map(container).setView([46.6, 2.4], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  let geojsonLayer: L.GeoJSON;

  function resetHighlight(e: L.LeafletMouseEvent): void {
    geojsonLayer.resetStyle(e.target as L.Layer);
  }

  function onEachFeature(feature: any, layer: L.Layer): void {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (e: L.LeafletMouseEvent) => {
        const code = feature.properties.code;
        OnDepartmentClick(code);
        map.fitBounds((e.target as L.Polygon).getBounds());
      },
    });
  }

  fetch(DEPARTMENTS_URL)
    .then((response) => response.json())
    .then((data) => {
      geojsonLayer = L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature,
      }).addTo(map);
    });
}