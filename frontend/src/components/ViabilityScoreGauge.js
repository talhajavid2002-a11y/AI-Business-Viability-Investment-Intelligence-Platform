import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ViabilityScoreGauge = ({ score }) => {
  // Calculate color based on score
  const getColor = (score) => {
    if (score >= 70) return '#10B981'; // green
    if (score >= 50) return '#F59E0B'; // yellow
    return '#EF4444'; // red
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
          {/* Semi-circle gauge */}
          <div className="relative w-64 h-32">
            {/* Background arc */}
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Colored arc */}
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
              {/* Needle */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="20"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground origin-bottom"
                style={{
                  transform: `rotate(${rotation - 90}deg)`,
                  transformOrigin: '100px 100px',
                  transition: 'transform 1s ease-out'
                }}
              />
              <circle cx="100" cy="100" r="6" fill="currentColor" className="text-foreground" />
            </svg>

            {/* Score display */}
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

          {/* Scale labels */}
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

export default ViabilityScoreGauge;
