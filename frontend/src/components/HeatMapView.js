import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HeatMapView = ({ businessType }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/area_heatmap`, {
          params: { business_type: businessType }
        });
        setHeatmapData(response.data.heatmap);
      } catch (error) {
        console.error('Error fetching heatmap:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessType]);

  const getMarkerColor = (score) => {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Loading area heatmap...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="heatmap-card">
      <CardHeader>
        <CardTitle>Best Areas for Investment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg overflow-hidden border">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken="pk.eyJ1IjoiZW1lcmdlbnQtYWkiLCJhIjoiY20zOXJqcG43MDQzbzJqcHpwcW5wbmlzbyJ9.x7VZE8vgvyLVoQnKzqfwmg"
          >
            {heatmapData.map((point, idx) => (
              <Marker
                key={idx}
                longitude={point.lng}
                latitude={point.lat}
                anchor="bottom"
              >
                <div className="relative group cursor-pointer">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
                    style={{ backgroundColor: getMarkerColor(point.score) }}
                    data-testid={`heatmap-marker-${idx}`}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                      <div className="font-semibold">{point.area_name}</div>
                      <div className="font-data">Score: {point.score.toFixed(0)}/100</div>
                    </div>
                  </div>
                </div>
              </Marker>
            ))}
          </Map>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-xs text-muted-foreground">High Score (70+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-xs text-muted-foreground">Medium Score (50-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-xs text-muted-foreground">Low Score (&lt;50)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatMapView;
