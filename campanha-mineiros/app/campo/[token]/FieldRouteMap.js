"use client";
import { useEffect, useRef } from "react";

export default function FieldRouteMap({ points, routeName }) {
  const mapNode = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((module) => {
      if (cancelled || !mapNode.current || map.current || !points?.length) return;
      const L = module.default;
      const coordinates = points.map((point) => [Number(point.lat), Number(point.lng)]);
      map.current = L.map(mapNode.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map.current);

      if (coordinates.length > 1) {
        L.polyline(coordinates, {
          color: "#3158d4",
          weight: 7,
          opacity: .92,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map.current);
      }

      coordinates.forEach((coordinate, index) => {
        const isStart = index === 0;
        const isEnd = index === coordinates.length - 1;
        L.circleMarker(coordinate, {
          radius: isStart || isEnd ? 10 : 4,
          color: "#fff",
          weight: isStart || isEnd ? 4 : 2,
          fillColor: isStart ? "#18a676" : isEnd ? "#ed665c" : "#3158d4",
          fillOpacity: 1,
        }).bindTooltip(isStart ? "Partida" : isEnd ? "Chegada" : "", {
          permanent: isStart || isEnd,
          direction: "top",
          offset: [0, -9],
          className: "field-route-tooltip",
        }).addTo(map.current);
      });

      if (coordinates.length === 1) map.current.setView(coordinates[0], 16);
      else map.current.fitBounds(L.latLngBounds(coordinates).pad(.2), { maxZoom: 17 });
      window.setTimeout(() => map.current?.invalidateSize(), 100);
    });

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [points]);

  return <div ref={mapNode} className="field-route-map" role="img" aria-label={`Mapa da rota ${routeName}`} />;
}
