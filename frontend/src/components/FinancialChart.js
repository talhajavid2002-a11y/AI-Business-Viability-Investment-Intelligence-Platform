import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialChart = ({ businessType, investmentBudget, locationId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/financial_projection`, {
          params: { business_type: businessType, investment_budget: investmentBudget, location_id: locationId }
        });
        setData(response.data.projections);
      } catch (error) {
        console.error('Error fetching financial projection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessType, investmentBudget, locationId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Loading financial projection...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="financial-chart-card">
      <CardHeader>
        <CardTitle>24-Month Financial Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
              className="text-xs"
            />
            <YAxis 
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              className="text-xs"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1" 
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.6}
              name="Revenue"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stackId="2" 
              stroke="#EF4444" 
              fill="#EF4444" 
              fillOpacity={0.6}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="cumulative_profit" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              name="Cumulative Profit"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
