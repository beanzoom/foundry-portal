/**
 * Investment & Market Constants for FleetDRMS Portal
 *
 * Centralized data constants used across investor calculators and DSP calculators.
 * All numbers are based on real market research and actual Amazon DSP invoice data.
 *
 * Last Updated: 2025-10-15
 */

// =====================================================
// MARKET DATA
// =====================================================

export const MARKET_DATA = {
  /** Total Amazon DSPs in USA market */
  totalDSPs: 3000,

  /** Total vehicles under management in USA */
  totalVehicles: {
    min: 60000,
    max: 120000,
  },

  /** Average fleet size per DSP */
  averageFleetSize: {
    min: 20,
    max: 40,
    default: 30,
  },

  /** Total Addressable Market (annual revenue) */
  annualTAM: {
    min: 55_000_000,  // $55M at conservative pricing
    max: 110_000_000, // $110M at optimistic pricing
  },
} as const;

// =====================================================
// PRICING TIERS
// =====================================================

export const PRICING_TIERS = {
  starter: {
    price: 25,
    label: 'Starter',
    description: 'Ideal for smaller fleets',
    targetFleet: '20-30 vehicles',
    color: 'blue',
  },
  professional: {
    price: 32,
    label: 'Professional',
    description: 'Most popular for mid-size fleets',
    targetFleet: '30-50 vehicles',
    color: 'green',
    recommended: true,
  },
  enterprise: {
    price: 40,
    label: 'Enterprise',
    description: 'For large-scale operations',
    targetFleet: '50+ vehicles',
    color: 'purple',
  },
} as const;

// =====================================================
// AFS (AUTHORIZED FLEET SIZE) FMP RATES
// Based on real Amazon DSP invoice data (Jan 2025)
// =====================================================

export const AFS_FMP_RATES = {
  /** Amazon-Owned Custom Delivery Van */
  amazonOwnedCDV: {
    rate: 475,
    label: 'Amazon-Owned CDV',
    description: 'Custom Delivery Van (Amazon-owned)',
  },

  /** Amazon-Owned Extended Van */
  amazonOwnedExtended: {
    rate: 500,
    label: 'Amazon-Owned Extended',
    description: 'Extended Van (Amazon-owned)',
  },

  /** Leased Extended Van (DSP-leased) */
  leasedExtended: {
    rate: 1075,
    label: 'Leased Extended Van',
    description: 'Extended Van (DSP-leased)',
  },

  /** Last Mile Rental Van */
  lastMileRental: {
    rate: 1350,
    label: 'Last Mile Rental',
    description: 'Branded Last Mile Rental Van',
  },

  /** Standard Rental Van */
  rental: {
    rate: 1800,
    label: 'Rental Van',
    description: 'Non-branded Rental Van',
  },

  /** Rivian Electric Vehicle */
  rivianEV: {
    rate: 550,
    label: 'Rivian EV',
    description: 'Rivian 500/700 Electric Vehicle',
  },

  /** Blended Average (for default calculations) */
  blendedAverage: {
    rate: 600,
    label: 'Blended Average',
    description: 'Average across all vehicle types',
  },

  /** Custom Rate (user-defined) */
  custom: {
    rate: 600,
    label: 'Custom Rate',
    description: 'Enter your own FMP rate',
  },
} as const;

// Helper to get AFS rate options for dropdowns
export const AFS_RATE_OPTIONS = Object.entries(AFS_FMP_RATES).map(([key, value]) => ({
  value: key,
  label: value.label,
  rate: value.rate,
  description: value.description,
}));

// =====================================================
// AFS CAPTURE RATES
// =====================================================

export const AFS_CAPTURE_RATES = {
  /** Manual tracking capture rate (industry standard) */
  manual: 40,

  /** FleetDRMS automated tracking capture rate */
  automated: 90,

  /** Improvement percentage */
  improvement: 50, // 90% - 40% = 50 percentage points
} as const;

// =====================================================
// COMPANY FINANCIAL METRICS
// =====================================================

export const COMPANY_METRICS = {
  /** Burn rate by phase */
  burnRate: {
    /** Pre-launch burn (months 1-6) */
    preLaunch: 60000,

    /** Post-launch burn (months 7+) */
    postLaunch: 40000,
  },

  /** Pilot customer details */
  pilots: {
    /** Number of committed pilot customers */
    count: 3,

    /** Launch month (from fundraise) */
    launchMonth: 3,
  },

  /** Capital raise targets */
  capitalRaise: {
    /** Target raise amount */
    target: 750000,

    /** Minimum acceptable */
    min: 500000,

    /** Maximum (if oversubscribed) */
    max: 1000000,
  },

  /** Use of funds breakdown (based on $750K raise) */
  useOfFunds: {
    productDevelopment: {
      amount: 300000,
      percentage: 40,
      label: 'Product Development',
      description: '6 months of development to MVP',
    },
    salesMarketing: {
      amount: 150000,
      percentage: 20,
      label: 'Sales & Marketing',
      description: 'Trade shows, campaigns, lead generation',
    },
    operations: {
      amount: 75000,
      percentage: 10,
      label: 'Operations',
      description: 'Infrastructure, tools, overhead',
    },
    workingCapital: {
      amount: 225000,
      percentage: 30,
      label: 'Working Capital',
      description: 'Runway buffer and contingency',
    },
  },
} as const;

// =====================================================
// CUSTOMER ACQUISITION ASSUMPTIONS
// =====================================================

export const CUSTOMER_ACQUISITION = {
  /** Conservative growth scenario */
  conservative: {
    rate: 4,
    label: 'Conservative',
    description: '4 new customers per month',
  },

  /** Base case scenario */
  base: {
    rate: 7,
    label: 'Base Case',
    description: '7 new customers per month',
    recommended: true,
  },

  /** Optimistic growth scenario */
  optimistic: {
    rate: 10,
    label: 'Optimistic',
    description: '10 new customers per month',
  },
} as const;

// =====================================================
// REVENUE MILESTONES
// =====================================================

export const REVENUE_MILESTONES = {
  breakEven: {
    mrr: 40000, // Monthly burn rate post-launch
    label: 'Break-Even',
    description: 'Monthly revenue covers operating costs',
  },

  milestone100K: {
    arr: 100000,
    label: '$100K ARR',
    description: 'First major revenue milestone',
  },

  milestone500K: {
    arr: 500000,
    label: '$500K ARR',
    description: 'Approaching profitability',
  },

  milestone1M: {
    arr: 1000000,
    label: '$1M ARR',
    description: 'Series A ready',
  },

  milestone5M: {
    arr: 5000000,
    label: '$5M ARR',
    description: 'Market leader position',
  },
} as const;

// =====================================================
// COMPETITIVE FEATURES
// =====================================================

export const COMPETITIVE_FEATURES = [
  {
    id: 'afs',
    name: 'AFS Revenue Recovery',
    priority: 1,
    monthlyValue: { min: 2000, max: 10000 },
    description: 'Automated tracking and submission of Authorized Fleet Size adjustments',
    icon: 'DollarSign',
    competitorHas: false,
    category: 'Revenue Protection',
  },
  {
    id: 'pace',
    name: 'PACE Automation',
    priority: 2,
    monthlyValue: { min: 2000, max: 2000 },
    description: 'Automated driver performance scoring and tracking',
    icon: 'TrendingUp',
    competitorHas: false,
    category: 'Performance Management',
  },
  {
    id: 'wave_planning',
    name: 'Wave Planning Automation',
    priority: 3,
    monthlyValue: { min: 2500, max: 2500 },
    description: 'Automated route dispatch with driver preferences',
    icon: 'MapPin',
    competitorHas: false,
    category: 'Operations',
  },
  {
    id: 'dep',
    name: 'DEP Constraint Tracking',
    priority: 4,
    monthlyValue: { min: 2000, max: 5000 },
    description: 'Driver Evaluation Period constraint enforcement',
    icon: 'Shield',
    competitorHas: false,
    category: 'Compliance',
  },
  {
    id: 'driver_center',
    name: 'Unified Driver Center',
    priority: 5,
    monthlyValue: { min: 1500, max: 1500 },
    description: 'Complete driver profile with history and interactions',
    icon: 'Users',
    competitorHas: false,
    category: 'Driver Management',
  },
] as const;

// Calculate total competitive value
export const TOTAL_COMPETITIVE_VALUE = {
  minMonthly: COMPETITIVE_FEATURES.reduce((sum, f) => sum + f.monthlyValue.min, 0),
  maxMonthly: COMPETITIVE_FEATURES.reduce((sum, f) => sum + f.monthlyValue.max, 0),
  minAnnual: COMPETITIVE_FEATURES.reduce((sum, f) => sum + f.monthlyValue.min, 0) * 12,
  maxAnnual: COMPETITIVE_FEATURES.reduce((sum, f) => sum + f.monthlyValue.max, 0) * 12,
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate ARR from monthly pricing
 */
export const calculateARR = (fleetSize: number, pricePerVehicle: number): number => {
  return fleetSize * pricePerVehicle * 12;
};

/**
 * Calculate customers needed for target ARR
 */
export const customersForARR = (targetARR: number, avgFleetSize: number, pricePerVehicle: number): number => {
  const arrPerCustomer = calculateARR(avgFleetSize, pricePerVehicle);
  return Math.ceil(targetARR / arrPerCustomer);
};

/**
 * Calculate market penetration percentage
 */
export const marketPenetration = (customers: number): number => {
  return (customers / MARKET_DATA.totalDSPs) * 100;
};

/**
 * Calculate break-even month based on customer acquisition
 */
export const calculateBreakEvenMonth = (
  monthlyAcquisition: number,
  avgFleetSize: number,
  pricePerVehicle: number,
  launchMonth: number = 3,
  postLaunchBurn: number = COMPANY_METRICS.burnRate.postLaunch
): number => {
  const mrrPerCustomer = avgFleetSize * pricePerVehicle;
  const customersNeeded = Math.ceil(postLaunchBurn / mrrPerCustomer);
  const monthsToBreakEven = Math.ceil(customersNeeded / monthlyAcquisition);
  return launchMonth + monthsToBreakEven;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with K/M suffix
 */
export const formatCompact = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
};
