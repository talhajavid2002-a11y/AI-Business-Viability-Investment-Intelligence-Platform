import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompetitionView = ({ locationId, businessType }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/competition_analysis`, {
          params: { location_id: locationId, business_type: businessType }
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching competition data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locationId, businessType]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Loading competition analysis...</div>
        </CardContent>
      </Card>
    );
  }

  const getDensityColor = (score) => {
    if (score > 75) return 'text-red-600 dark:text-red-400';
    if (score > 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getDensityLabel = (score) => {
    if (score > 75) return 'High';
    if (score > 50) return 'Medium';
    return 'Low';
  };

  return (
    <Card data-testid="competition-card">
      <CardHeader>
        <CardTitle>Competition Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Competitors</p>
            <p className="text-2xl font-bold font-data" data-testid="total-competitors">{data.total_competitors}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Density Level</p>
            <p className={`text-2xl font-bold ${getDensityColor(data.density_score)}`} data-testid="density-level">
              {getDensityLabel(data.density_score)}
            </p>
          </div>
        </div>

        {/* Nearby businesses */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Nearby Businesses</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.nearby_businesses.map((business, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                data-testid={`competitor-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{business.name}</p>
                    <p className="text-xs text-muted-foreground">{business.distance} miles away</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-data">{business.rating}</span>
                  <span className="text-xs text-muted-foreground">({business.reviews})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionView;
