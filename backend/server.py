from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MOCK DATA ============

BUSINESS_TYPES = [
    {"id": "cafe", "name": "Coffee Shop / Café", "category": "Food & Beverage", "avg_startup_cost": 80000, "avg_roi": 0.25},
    {"id": "restaurant", "name": "Restaurant", "category": "Food & Beverage", "avg_startup_cost": 200000, "avg_roi": 0.20},
    {"id": "retail_clothing", "name": "Retail Clothing Store", "category": "Retail", "avg_startup_cost": 100000, "avg_roi": 0.22},
    {"id": "gym", "name": "Fitness Center / Gym", "category": "Health & Wellness", "avg_startup_cost": 150000, "avg_roi": 0.28},
    {"id": "salon", "name": "Hair Salon / Spa", "category": "Beauty & Personal Care", "avg_startup_cost": 75000, "avg_roi": 0.30},
    {"id": "bookstore", "name": "Bookstore", "category": "Retail", "avg_startup_cost": 90000, "avg_roi": 0.18},
    {"id": "coworking", "name": "Coworking Space", "category": "Business Services", "avg_startup_cost": 250000, "avg_roi": 0.24},
    {"id": "bakery", "name": "Bakery", "category": "Food & Beverage", "avg_startup_cost": 120000, "avg_roi": 0.26},
    {"id": "pet_store", "name": "Pet Store", "category": "Retail", "avg_startup_cost": 85000, "avg_roi": 0.23},
    {"id": "laundromat", "name": "Laundromat", "category": "Services", "avg_startup_cost": 200000, "avg_roi": 0.35},
]

US_LOCATIONS = [
    {
        "id": "nyc_manhattan",
        "city": "New York",
        "state": "NY",
        "area": "Manhattan",
        "population": 1629000,
        "median_income": 85000,
        "foot_traffic": 95,
        "rent_index": 90,
        "crime_index": 45,
        "lat": 40.7831,
        "lng": -73.9712,
        "demand_trend": "high",
        "competition_density": 85
    },
    {
        "id": "la_downtown",
        "city": "Los Angeles",
        "state": "CA",
        "area": "Downtown LA",
        "population": 700000,
        "median_income": 70000,
        "foot_traffic": 85,
        "rent_index": 75,
        "crime_index": 55,
        "lat": 34.0522,
        "lng": -118.2437,
        "demand_trend": "high",
        "competition_density": 78
    },
    {
        "id": "sf_soma",
        "city": "San Francisco",
        "state": "CA",
        "area": "SoMa",
        "population": 450000,
        "median_income": 120000,
        "foot_traffic": 88,
        "rent_index": 95,
        "crime_index": 50,
        "lat": 37.7749,
        "lng": -122.4194,
        "demand_trend": "high",
        "competition_density": 82
    },
    {
        "id": "chicago_loop",
        "city": "Chicago",
        "state": "IL",
        "area": "The Loop",
        "population": 500000,
        "median_income": 65000,
        "foot_traffic": 80,
        "rent_index": 60,
        "crime_index": 60,
        "lat": 41.8781,
        "lng": -87.6298,
        "demand_trend": "medium",
        "competition_density": 70
    },
    {
        "id": "austin_downtown",
        "city": "Austin",
        "state": "TX",
        "area": "Downtown",
        "population": 350000,
        "median_income": 75000,
        "foot_traffic": 75,
        "rent_index": 65,
        "crime_index": 40,
        "lat": 30.2672,
        "lng": -97.7431,
        "demand_trend": "high",
        "competition_density": 65
    },
    {
        "id": "miami_brickell",
        "city": "Miami",
        "state": "FL",
        "area": "Brickell",
        "population": 400000,
        "median_income": 68000,
        "foot_traffic": 78,
        "rent_index": 70,
        "crime_index": 52,
        "lat": 25.7617,
        "lng": -80.1918,
        "demand_trend": "high",
        "competition_density": 72
    },
    {
        "id": "seattle_capitol_hill",
        "city": "Seattle",
        "state": "WA",
        "area": "Capitol Hill",
        "population": 380000,
        "median_income": 95000,
        "foot_traffic": 82,
        "rent_index": 80,
        "crime_index": 45,
        "lat": 47.6062,
        "lng": -122.3321,
        "demand_trend": "medium",
        "competition_density": 75
    },
    {
        "id": "boston_back_bay",
        "city": "Boston",
        "state": "MA",
        "area": "Back Bay",
        "population": 320000,
        "median_income": 88000,
        "foot_traffic": 85,
        "rent_index": 85,
        "crime_index": 35,
        "lat": 42.3601,
        "lng": -71.0589,
        "demand_trend": "medium",
        "competition_density": 80
    },
]

# ============ MODELS ============

class ViabilityRequest(BaseModel):
    business_type: str
    location_id: str
    investment_budget: float
    business_size: Optional[int] = 1000
    risk_appetite: str = "medium"

class FactorDetail(BaseModel):
    name: str
    score: float
    description: str

class ViabilityResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    viability_score: float
    success_probability: float
    risk_level: str
    expected_roi_min: float
    expected_roi_max: float
    breakeven_months: int
    positive_factors: List[FactorDetail]
    risk_factors: List[FactorDetail]
    ai_insights: str

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    score: float
    area_name: str

class CompetitionData(BaseModel):
    total_competitors: int
    density_score: float
    nearby_businesses: List[Dict]

class FinancialProjection(BaseModel):
    month: int
    revenue: float
    expenses: float
    profit: float
    cumulative_profit: float

# ============ BUSINESS LOGIC ============

def calculate_demand_score(location: Dict, business: Dict) -> float:
    """Calculate demand score based on location demographics and business type"""
    income_factor = min(location['median_income'] / 100000, 1.0)
    traffic_factor = location['foot_traffic'] / 100
    trend_factor = 1.0 if location['demand_trend'] == 'high' else 0.7
    
    return (income_factor * 0.4 + traffic_factor * 0.4 + trend_factor * 0.2) * 100

def calculate_competition_score(location: Dict) -> float:
    """Calculate competition score (inverse - lower competition is better)"""
    density = location['competition_density']
    return max(100 - density, 20)

def calculate_location_quality(location: Dict) -> float:
    """Calculate location quality score"""
    safety_score = max(100 - location['crime_index'], 30)
    accessibility_score = location['foot_traffic']
    rent_affordability = max(100 - location['rent_index'], 20)
    
    return (safety_score * 0.4 + accessibility_score * 0.4 + rent_affordability * 0.2)

def calculate_financial_feasibility(investment: float, business: Dict, location: Dict) -> float:
    """Calculate financial feasibility"""
    required_capital = business['avg_startup_cost']
    budget_ratio = min(investment / required_capital, 1.5)
    
    if budget_ratio < 0.7:
        return 40
    elif budget_ratio < 1.0:
        return 60
    elif budget_ratio < 1.2:
        return 85
    else:
        return 95

def calculate_trend_score(business: Dict, location: Dict) -> float:
    """Calculate trend score based on market dynamics"""
    base_score = 70
    if location['demand_trend'] == 'high':
        base_score += 20
    
    if business['avg_roi'] > 0.25:
        base_score += 10
    
    return min(base_score, 100)

def calculate_risk_score(location: Dict, investment: float, business: Dict) -> float:
    """Calculate risk score (lower is better, so we invert)"""
    crime_risk = location['crime_index']
    competition_risk = location['competition_density']
    financial_risk = 100 if investment < business['avg_startup_cost'] * 0.8 else 50
    
    total_risk = (crime_risk * 0.3 + competition_risk * 0.4 + financial_risk * 0.3)
    return max(100 - total_risk, 20)

async def generate_ai_insights(business_name: str, viability_score: float, location_name: str, positive_factors: List[FactorDetail], risk_factors: List[FactorDetail]) -> str:
    """Use LLM to generate insights"""
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            return "AI insights unavailable - API key not configured."
        
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"viability_{uuid.uuid4()}",
            system_message="You are an expert business analyst providing investment insights. Be concise and actionable."
        ).with_model("openai", "gpt-5.2")
        
        positive_summary = ", ".join([f"{f.name} ({f.score:.0f}/100)" for f in positive_factors])
        risk_summary = ", ".join([f"{f.name}" for f in risk_factors])
        
        prompt = f"""Analyze this business opportunity:

Business: {business_name}
Location: {location_name}
Viability Score: {viability_score:.0f}/100

Strengths: {positive_summary}
Risks: {risk_summary}

Provide 2-3 sentence expert insight focusing on the key decision factors for an investor."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response
        
    except Exception as e:
        logger.error(f"LLM insight generation failed: {e}")
        return f"Based on the viability score of {viability_score:.0f}/100, this represents a {'strong' if viability_score > 70 else 'moderate' if viability_score > 50 else 'challenging'} investment opportunity in {location_name}."

# ============ API ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "AI Business Viability Platform API"}

@api_router.get("/business-types")
async def get_business_types():
    """Get all available business types"""
    return {"business_types": BUSINESS_TYPES}

@api_router.get("/locations")
async def get_locations():
    """Get all available locations"""
    return {"locations": US_LOCATIONS}

@api_router.post("/predict_viability", response_model=ViabilityResponse)
async def predict_viability(request: ViabilityRequest):
    """Main endpoint to calculate business viability"""
    try:
        # Find business and location
        business = next((b for b in BUSINESS_TYPES if b['id'] == request.business_type), None)
        location = next((l for l in US_LOCATIONS if l['id'] == request.location_id), None)
        
        if not business or not location:
            raise HTTPException(status_code=404, detail="Business type or location not found")
        
        # Calculate component scores
        D = calculate_demand_score(location, business)
        C = calculate_competition_score(location)
        L = calculate_location_quality(location)
        F = calculate_financial_feasibility(request.investment_budget, business, location)
        T = calculate_trend_score(business, location)
        R = calculate_risk_score(location, request.investment_budget, business)
        
        # Calculate BVS using the formula
        BVS = 0.25 * D + 0.20 * C + 0.20 * L + 0.15 * F + 0.10 * T + 0.10 * R
        
        # Calculate success probability (sigmoid-like transformation)
        success_prob = min(max((BVS - 30) / 70 * 100, 10), 95)
        
        # Determine risk level
        if request.risk_appetite == "low":
            risk_threshold = {"high": 60, "medium": 75}
        elif request.risk_appetite == "high":
            risk_threshold = {"high": 50, "medium": 65}
        else:
            risk_threshold = {"high": 55, "medium": 70}
        
        if BVS < risk_threshold["high"]:
            risk_level = "High"
        elif BVS < risk_threshold["medium"]:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # Calculate ROI
        base_roi = business['avg_roi']
        roi_multiplier = BVS / 70
        expected_roi_min = base_roi * roi_multiplier * 0.8
        expected_roi_max = base_roi * roi_multiplier * 1.3
        
        # Calculate breakeven
        base_breakeven = 18
        breakeven_months = int(base_breakeven * (100 / max(BVS, 40)))
        
        # Prepare factors
        positive_factors = [
            FactorDetail(name="Demand Score", score=D, description=f"Strong market demand based on demographics and foot traffic"),
            FactorDetail(name="Location Quality", score=L, description=f"Excellent location with good accessibility and safety"),
            FactorDetail(name="Market Trends", score=T, description=f"Positive industry trends favor growth"),
        ]
        positive_factors.sort(key=lambda x: x.score, reverse=True)
        
        risk_factors = [
            FactorDetail(name="Competition Density", score=location['competition_density'], description=f"High number of similar businesses in the area"),
            FactorDetail(name="Crime Index", score=location['crime_index'], description=f"Area safety concerns may impact customer traffic"),
            FactorDetail(name="Rent Costs", score=location['rent_index'], description=f"Higher than average commercial rent"),
        ]
        risk_factors.sort(key=lambda x: x.score, reverse=True)
        
        # Generate AI insights
        ai_insights = await generate_ai_insights(
            business['name'],
            BVS,
            f"{location['area']}, {location['city']}",
            positive_factors[:3],
            risk_factors[:3]
        )
        
        response = ViabilityResponse(
            viability_score=round(BVS, 1),
            success_probability=round(success_prob, 1),
            risk_level=risk_level,
            expected_roi_min=round(expected_roi_min, 2),
            expected_roi_max=round(expected_roi_max, 2),
            breakeven_months=breakeven_months,
            positive_factors=positive_factors[:3],
            risk_factors=risk_factors[:3],
            ai_insights=ai_insights
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in predict_viability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/area_heatmap")
async def get_area_heatmap(business_type: str):
    """Get heatmap data for different areas"""
    heatmap_data = []
    
    for location in US_LOCATIONS:
        business = next((b for b in BUSINESS_TYPES if b['id'] == business_type), BUSINESS_TYPES[0])
        
        # Quick score calculation
        D = calculate_demand_score(location, business)
        C = calculate_competition_score(location)
        L = calculate_location_quality(location)
        score = (D * 0.4 + C * 0.3 + L * 0.3)
        
        heatmap_data.append(HeatmapPoint(
            lat=location['lat'],
            lng=location['lng'],
            score=round(score, 1),
            area_name=f"{location['area']}, {location['city']}"
        ))
    
    return {"heatmap": heatmap_data}

@api_router.get("/competition_analysis")
async def get_competition_analysis(location_id: str, business_type: str):
    """Get competition analysis for a specific location"""
    location = next((l for l in US_LOCATIONS if l['id'] == location_id), None)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Generate mock competitor data
    num_competitors = int(location['competition_density'] / 10)
    nearby_businesses = []
    
    for i in range(min(num_competitors, 8)):
        nearby_businesses.append({
            "name": f"Competitor {i+1}",
            "distance": round(random.uniform(0.1, 2.5), 1),
            "rating": round(random.uniform(3.5, 4.8), 1),
            "reviews": random.randint(50, 500)
        })
    
    return CompetitionData(
        total_competitors=num_competitors,
        density_score=location['competition_density'],
        nearby_businesses=nearby_businesses
    )

@api_router.get("/financial_projection")
async def get_financial_projection(business_type: str, investment_budget: float, location_id: str):
    """Get 24-month financial projection"""
    business = next((b for b in BUSINESS_TYPES if b['id'] == business_type), None)
    location = next((l for l in US_LOCATIONS if l['id'] == location_id), None)
    
    if not business or not location:
        raise HTTPException(status_code=404, detail="Business type or location not found")
    
    projections = []
    monthly_revenue_base = investment_budget * business['avg_roi'] / 12
    monthly_expenses = investment_budget * 0.05
    cumulative = -investment_budget
    
    for month in range(1, 25):
        # Revenue grows over time
        growth_factor = min(month / 12, 1.5)
        revenue = monthly_revenue_base * growth_factor * random.uniform(0.85, 1.15)
        expenses = monthly_expenses * random.uniform(0.9, 1.1)
        profit = revenue - expenses
        cumulative += profit
        
        projections.append(FinancialProjection(
            month=month,
            revenue=round(revenue, 2),
            expenses=round(expenses, 2),
            profit=round(profit, 2),
            cumulative_profit=round(cumulative, 2)
        ))
    
    return {"projections": projections}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
