import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HeatMapView = ({ businessType }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Loading area analysis...</div>
        </CardContent>
      </Card>
    );
  }

  // Sort by score
  const sortedData = [...heatmapData].sort((a, b) => b.score - a.score);

  return (
    <Card data-testid="heatmap-card">
      <CardHeader>
        <CardTitle>Best Areas for Investment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((point, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              data-testid={`area-${idx}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getScoreColor(point.score)}`} />
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{point.area_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Viability Score</span>
                <span className={`text-xl font-bold font-data ${getScoreTextColor(point.score)}`}>
                  {point.score.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">High Score (70+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Medium Score (50-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Low Score (&lt;50)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatMapView;
