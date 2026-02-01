import { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Sun, TrendingUp, Building2, MapPin, Star } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Viability Score Gauge Component
const ViabilityScoreGauge = ({ score }) => {
  const getColor = (score) => {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getLabel = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    return 'Poor';
  };

  const color = getColor(score);
  const percentage = score;
  const rotation = (percentage / 100) * 180;

  return (
    <Card data-testid="viability-score-card">
      <CardHeader>
        <CardTitle>Business Viability Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-8">
          <div className="relative w-64 h-32">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200 dark:text-gray-700"
              />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * percentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground"
                style={{
                  transform: `rotate(${rotation - 90}deg)`,
                  transformOrigin: '100px 100px',
                  transition: 'transform 1s ease-out'
                }}
              />
              <circle cx="100" cy="100" r="6" fill="currentColor" className="text-foreground" />
            </svg>

            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <div className="text-center">
                <div className="text-4xl font-bold font-data" style={{ color }} data-testid="viability-score-value">
                  {score.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {getLabel(score)}
                </div>
              </div>
            </div>
          </div>

          <div className="w-64 flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { theme, setTheme } = useTheme();
  const [businessTypes, setBusinessTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [competitionData, setCompetitionData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  
  const [formData, setFormData] = useState({
    business_type: '',
    location_id: '',
    investment_budget: '',
    business_size: 1000,
    risk_appetite: 'medium'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [businessRes, locationsRes] = await Promise.all([
          axios.get(`${API}/business-types`),
          axios.get(`${API}/locations`)
        ]);
        setBusinessTypes(businessRes.data.business_types);
        setLocations(locationsRes.data.locations);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load initial data');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (analysisResult && formData.business_type && formData.location_id && formData.investment_budget) {
      loadFinancialData();
      loadCompetitionData();
      loadHeatmapData();
    }
  }, [analysisResult]);

  const loadFinancialData = async () => {
    try {
      const response = await axios.get(`${API}/financial_projection`, {
        params: {
          business_type: formData.business_type,
          investment_budget: parseFloat(formData.investment_budget),
          location_id: formData.location_id
        }
      });
      setFinancialData(response.data.projections);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const loadCompetitionData = async () => {
    try {
      const response = await axios.get(`${API}/competition_analysis`, {
        params: {
          location_id: formData.location_id,
          business_type: formData.business_type
        }
      });
      setCompetitionData(response.data);
    } catch (error) {
      console.error('Error loading competition data:', error);
    }
  };

  const loadHeatmapData = async () => {
    try {
      const response = await axios.get(`${API}/area_heatmap`, {
        params: { business_type: formData.business_type }
      });
      setHeatmapData(response.data.heatmap.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.business_type || !formData.location_id || !formData.investment_budget) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/predict_viability`, {
        business_type: formData.business_type,
        location_id: formData.location_id,
        investment_budget: parseFloat(formData.investment_budget),
        business_size: formData.business_size,
        risk_appetite: formData.risk_appetite
      });
      
      setAnalysisResult(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'High': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ViabilityHub</h1>
              <p className="text-xs text-muted-foreground">AI Investment Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            data-testid="theme-toggle-button"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card data-testid="input-panel">
              <CardHeader>
                <CardTitle>Business Analysis</CardTitle>
                <CardDescription>Enter your business details to get viability insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Select 
                    value={formData.business_type} 
                    onValueChange={(value) => setFormData({...formData, business_type: value})}
                  >
                    <SelectTrigger id="business-type" data-testid="business-type-select">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={formData.location_id} 
                    onValueChange={(value) => setFormData({...formData, location_id: value})}
                  >
                    <SelectTrigger id="location" data-testid="location-select">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.area}, {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Investment Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="100000"
                    value={formData.investment_budget}
                    onChange={(e) => setFormData({...formData, investment_budget: e.target.value})}
                    data-testid="investment-budget-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Business Size (sq ft)</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="1000"
                    value={formData.business_size}
                    onChange={(e) => setFormData({...formData, business_size: e.target.value})}
                    data-testid="business-size-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk">Risk Appetite</Label>
                  <Select 
                    value={formData.risk_appetite} 
                    onValueChange={(value) => setFormData({...formData, risk_appetite: value})}
                  >
                    <SelectTrigger id="risk" data-testid="risk-appetite-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  className="w-full" 
                  disabled={loading}
                  data-testid="analyze-button"
                >
                  {loading ? 'Analyzing...' : 'Analyze Viability'}
                </Button>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card data-testid="quick-stats-card">
                <CardHeader>
                  <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-semibold font-data" data-testid="success-probability">
                      {analysisResult.success_probability}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Break-even</span>
                    <span className="font-semibold font-data" data-testid="breakeven-months">
                      {analysisResult.breakeven_months} months
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected ROI</span>
                    <span className="font-semibold font-data" data-testid="roi-range">
                      {(analysisResult.expected_roi_min * 100).toFixed(0)}-{(analysisResult.expected_roi_max * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <span className={`font-semibold ${getRiskColor(analysisResult.risk_level)}`} data-testid="risk-level">
                      {analysisResult.risk_level}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {!analysisResult ? (
              <Card className="h-[500px] flex items-center justify-center" data-testid="empty-state">
                <div className="text-center space-y-4">
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground">Fill in the form and click "Analyze Viability" to get started</p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <ViabilityScoreGauge score={analysisResult.viability_score} />

                <Card data-testid="ai-insights-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed" data-testid="ai-insights-text">
                      {analysisResult.ai_insights}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card data-testid="positive-factors-card">
                    <CardHeader>
                      <CardTitle className="text-base text-green-600 dark:text-green-400">Top Positive Factors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisResult.positive_factors.map((factor, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{factor.name}</span>
                            <span className="text-sm font-data text-green-600 dark:text-green-400">
                              {factor.score.toFixed(0)}/100
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card data-testid="risk-factors-card">
                    <CardHeader>
                      <CardTitle className="text-base text-red-600 dark:text-red-400">Risk Factors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisResult.risk_factors.map((factor, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{factor.name}</span>
                            <span className="text-sm font-data text-red-600 dark:text-red-400">
                              {factor.score.toFixed(0)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {financialData.length > 0 && (
                  <Card data-testid="financial-chart-card">
                    <CardHeader>
                      <CardTitle>24-Month Financial Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={financialData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Revenue" />
                          <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Expenses" />
                          <Line type="monotone" dataKey="cumulative_profit" stroke="#3B82F6" strokeWidth={2} dot={false} name="Cumulative Profit" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {competitionData && (
                  <Card data-testid="competition-card">
                    <CardHeader>
                      <CardTitle>Competition Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Competitors</p>
                          <p className="text-2xl font-bold font-data" data-testid="total-competitors">{competitionData.total_competitors}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Density Level</p>
                          <p className={`text-2xl font-bold ${getDensityColor(competitionData.density_score)}`} data-testid="density-level">
                            {getDensityLabel(competitionData.density_score)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Nearby Businesses</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {competitionData.nearby_businesses.map((business, idx) => (
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
                )}

                {heatmapData.length > 0 && (
                  <Card data-testid="heatmap-card">
                    <CardHeader>
                      <CardTitle>Best Areas for Investment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {heatmapData.map((point, idx) => (
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
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
