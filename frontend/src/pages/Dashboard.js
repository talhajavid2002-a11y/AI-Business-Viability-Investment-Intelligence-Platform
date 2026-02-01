import { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Sun, TrendingUp, DollarSign, AlertTriangle, MapPin, Building2 } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ViabilityScoreGauge from '../components/ViabilityScoreGauge';
import FinancialChart from '../components/FinancialChart';
import HeatMapView from '../components/HeatMapView';
import CompetitionView from '../components/CompetitionView';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [businessTypes, setBusinessTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    business_type: '',
    location_id: '',
    investment_budget: '',
    business_size: 1000,
    risk_appetite: 'medium'
  });

  // Load business types and locations
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          {/* Left Panel - Input Form */}
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

            {/* Quick Stats */}
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

          {/* Right Panel - Results */}
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
                {/* Viability Score */}
                <ViabilityScoreGauge score={analysisResult.viability_score} />

                {/* AI Insights */}
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

                {/* Positive & Risk Factors */}
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

                {/* Financial Projection */}
                {formData.business_type && formData.location_id && (
                  <FinancialChart 
                    businessType={formData.business_type}
                    investmentBudget={parseFloat(formData.investment_budget)}
                    locationId={formData.location_id}
                  />
                )}

                {/* Competition Analysis */}
                {formData.location_id && formData.business_type && (
                  <CompetitionView 
                    locationId={formData.location_id}
                    businessType={formData.business_type}
                  />
                )}

                {/* Heat Map */}
                {formData.business_type && (
                  <HeatMapView businessType={formData.business_type} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
