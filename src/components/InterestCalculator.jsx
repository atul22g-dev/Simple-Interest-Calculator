import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './InterestCalculator.css';
// Import All Functions
import { parseIndianFormat, formatIndianAmount } from '../func/InterestCalculatorFunc';

/* ------------------------------------------------------------------ */
/* Icons (inline SVG — no icon dependency)                            */
/* ------------------------------------------------------------------ */
const svgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

const ICONS = {
  plus: (
    <svg {...svgBase}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  ),
  reset: (
    <svg {...svgBase}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  close: (
    <svg {...svgBase}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  arrow: (
    <svg {...svgBase}>
      <path d="M5 12h13M12.5 6.5 19 12l-6.5 5.5" />
    </svg>
  ),
  chevron: (
    <svg {...svgBase}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  copy: (
    <svg {...svgBase}>
      <rect x="8.5" y="8.5" width="12.5" height="12.5" rx="2.4" />
      <path d="M4.5 15.5A2.5 2.5 0 0 1 2 13V5a2.5 2.5 0 0 1 2.5-2.5H13a2.5 2.5 0 0 1 2.5 2.5v1" />
    </svg>
  ),
  check: (
    <svg {...svgBase}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.4 2.6 2.6 5-5.6" />
    </svg>
  ),
  alert: (
    <svg {...svgBase}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.4v5.2M12 16.3h.01" />
    </svg>
  ),
  info: (
    <svg {...svgBase}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.2v5M12 7.8h.01" />
    </svg>
  ),
  trend: (
    <svg {...svgBase}>
      <path d="M22 7.5 13.5 16l-4-4L2 17.5" />
      <path d="M16 7.5h6v6" />
    </svg>
  ),
  wallet: (
    <svg {...svgBase}>
      <rect x="2.5" y="6" width="19" height="13" rx="2.6" />
      <path d="M2.5 10.4h19M6.5 15h4" />
    </svg>
  ),
  gem: (
    <svg {...svgBase}>
      <path d="M6.5 3h11l3.7 5.6L12 21 2.8 8.6Z" />
      <path d="M11 3 8 8.6 12 21l4-12.4L13 3M2.8 8.6h18.4" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Localisation helpers                                                */
/* ------------------------------------------------------------------ */
const TENURE_LABELS = {
  day: ['day', 'days'],
  month: ['month', 'months'],
  quarter: ['quarter', 'quarters'],
  year: ['year', 'years'],
};

const formatTenure = (timePeriod) => {
  if (!timePeriod) return '1 year';
  const pair = TENURE_LABELS[timePeriod.unit] || TENURE_LABELS.year;
  const count = parseFloat(timePeriod.value);
  const label = count === 1 ? pair[0] : pair[1];
  return `${timePeriod.value} ${label}`;
};

const round2 = (value) => Math.round((value || 0) * 100) / 100;

/* Big headline figures read better as whole rupees, Indian digit grouping */
const formatStat = (value) =>
  Math.round(Number.isFinite(value) ? value : 0).toLocaleString('en-IN');

/* ------------------------------------------------------------------ */
/* Animated counter (rAF, respects prefers-reduced-motion)             */
/* ------------------------------------------------------------------ */
function useAnimatedNumber(target) {
  const initial = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(initial);
  const fromRef = useRef(initial);

  useEffect(() => {
    const to = Number.isFinite(target) ? target : 0;
    const from = Number.isFinite(fromRef.current) ? fromRef.current : 0;

    if (from === to) {
      setDisplay(to);
      return undefined;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      fromRef.current = to;
      setDisplay(to);
      return undefined;
    }

    const duration = 700;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      fromRef.current = value;
      setDisplay(value);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
}

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */
const COMPOUND_OPTIONS = [
  { value: 'annually', label: 'Annually' },
  { value: 'semi-annually', label: 'Half-yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

const UNIT_OPTIONS = [
  { value: 'day', label: 'Days' },
  { value: 'month', label: 'Months' },
  { value: 'quarter', label: 'Quarters' },
  { value: 'year', label: 'Years' },
];

const TOAST_LIFETIME = 4200;
const MAX_TOASTS = 3;

function InterestCalculator() {
  // Default values
  const defaultRates = useMemo(() => ['4.00', '6.25', '7.50', '7.75'], []);
  const defaultThresholds = useMemo(
    () => ['100000', '500000', '500000000', 'Infinity'],
    []
  );

  // State variables
  const [amount, setAmount] = useState('');
  const [interestRates, setInterestRates] = useState(defaultRates);
  const [tierThresholds, setTierThresholds] = useState(defaultThresholds);
  const [timePeriod, setTimePeriod] = useState({
    value: '1',
    unit: 'year',
  });
  const [isCompound, setIsCompound] = useState(false);
  const [compoundFrequency, setCompoundFrequency] = useState('annually');
  const [result, setResult] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedCalculations, setShowSavedCalculations] = useState(false);

  // Toast notifications (replace blocking alert() calls)
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef([]);

  useEffect(
    () => () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current = [];
    },
    []
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, tone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, tone }].slice(-MAX_TOASTS));

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        toastTimers.current = toastTimers.current.filter((entry) => entry !== timer);
      }, TOAST_LIFETIME);
      toastTimers.current.push(timer);
    },
    []
  );

  // Generate tier names based on thresholds
  const getTierNames = (thresholds) => {
    const names = [];
    for (let i = 0; i < thresholds.length; i++) {
      if (i === 0) {
        names.push(`Upto ₹${formatAmount(thresholds[i])}`);
      } else if (thresholds[i] === 'Infinity') {
        names.push(`Above ₹${formatAmount(thresholds[i - 1])}`);
      } else {
        names.push(
          `Above ₹${formatAmount(thresholds[i - 1])} upto ₹${formatAmount(thresholds[i])}`
        );
      }
    }
    return names;
  };

  // Format amount for display
  const formatAmount = (value) => {
    // Use our utility function
    return formatIndianAmount(value, 'text').replace('₹', '');
  };

  // Get current tiers based on thresholds
  const getCurrentTiers = () => {
    const names = getTierNames(tierThresholds);
    return tierThresholds.map((threshold, index) => {
      const value = threshold === 'Infinity' ? Infinity : parseFloat(threshold);
      return {
        maxAmount: value,
        name: names[index],
      };
    });
  };

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedRates = localStorage.getItem('interestRates');
    if (savedRates) {
      setInterestRates(JSON.parse(savedRates));
    }

    const savedThresholds = localStorage.getItem('tierThresholds');
    if (savedThresholds) {
      setTierThresholds(JSON.parse(savedThresholds));
    }

    const savedAmount = localStorage.getItem('amount');
    if (savedAmount) {
      setAmount(savedAmount);
    }

    const savedTimePeriod = localStorage.getItem('timePeriod');
    if (savedTimePeriod) {
      setTimePeriod(JSON.parse(savedTimePeriod));
    }

    const savedCalcs = localStorage.getItem('calculations');
    if (savedCalcs) {
      setSavedCalculations(JSON.parse(savedCalcs));
    }
  }, []);

  // Update interest rate for a specific tier
  const updateInterestRate = (index, value) => {
    const newRates = [...interestRates];
    newRates[index] = value;
    setInterestRates(newRates);

    // Save to localStorage
    localStorage.setItem('interestRates', JSON.stringify(newRates));
  };

  // Update amount and save to localStorage
  const updateAmount = (value) => {
    setAmount(value);
    localStorage.setItem('amount', value);
  };

  // Update time period value
  const updateTimePeriodValue = (value) => {
    const newTimePeriod = { ...timePeriod, value };
    setTimePeriod(newTimePeriod);
    localStorage.setItem('timePeriod', JSON.stringify(newTimePeriod));
  };

  // Update time period unit
  const updateTimePeriodUnit = (unit) => {
    const newTimePeriod = { ...timePeriod, unit };
    setTimePeriod(newTimePeriod);
    localStorage.setItem('timePeriod', JSON.stringify(newTimePeriod));
  };

  // Update tier threshold for a specific tier
  const updateTierThreshold = (index, value) => {
    // Don't allow editing the last threshold (Infinity)
    if (index === tierThresholds.length - 1) return;

    const newThresholds = [...tierThresholds];
    newThresholds[index] = value;
    setTierThresholds(newThresholds);

    // Update interest rates array if needed
    if (interestRates.length !== newThresholds.length) {
      const newRates = [...interestRates];
      while (newRates.length < newThresholds.length) {
        newRates.push('4.00'); // Default rate for new tiers
      }
      while (newRates.length > newThresholds.length) {
        newRates.pop();
      }
      setInterestRates(newRates);
      localStorage.setItem('interestRates', JSON.stringify(newRates));
    }

    // Save to localStorage
    localStorage.setItem('tierThresholds', JSON.stringify(newThresholds));
  };

  // Add a new tier
  const addTier = () => {
    // Don't add if we already have a lot of tiers
    if (tierThresholds.length >= 10) {
      pushToast('Maximum of 10 rate slabs allowed', 'error');
      return;
    }

    // Get the last non-infinity threshold and suggest a higher value
    const lastThresholdValue =
      parseFloat(tierThresholds[tierThresholds.length - 2]) || 100000;
    const suggestedNewThreshold = lastThresholdValue * 2;

    // Insert the new threshold before the Infinity threshold
    const newThresholds = [...tierThresholds];
    newThresholds.splice(newThresholds.length - 1, 0, suggestedNewThreshold.toString());
    setTierThresholds(newThresholds);

    // Add a corresponding interest rate
    const newRates = [...interestRates, '4.00']; // Default rate for new tier
    setInterestRates(newRates);

    // Save to localStorage
    localStorage.setItem('tierThresholds', JSON.stringify(newThresholds));
    localStorage.setItem('interestRates', JSON.stringify(newRates));
  };

  // Remove a tier
  const removeTier = (index) => {
    // Don't allow removing if we only have 2 tiers (1 regular + Infinity)
    if (tierThresholds.length <= 2) {
      pushToast('At least one rate slab is required', 'error');
      return;
    }

    // Don't allow removing the Infinity tier
    if (index === tierThresholds.length - 1) {
      pushToast('The top slab has no upper limit — it cannot be removed', 'error');
      return;
    }

    // Remove the threshold and corresponding interest rate
    const newThresholds = tierThresholds.filter((_, i) => i !== index);
    const newRates = interestRates.filter((_, i) => i !== index);

    setTierThresholds(newThresholds);
    setInterestRates(newRates);

    // Save to localStorage
    localStorage.setItem('tierThresholds', JSON.stringify(newThresholds));
    localStorage.setItem('interestRates', JSON.stringify(newRates));
  };

  // Reset to default values
  const resetToDefaults = () => {
    setInterestRates(defaultRates);
    setTierThresholds(defaultThresholds);

    // Save to localStorage
    localStorage.setItem('interestRates', JSON.stringify(defaultRates));
    localStorage.setItem('tierThresholds', JSON.stringify(defaultThresholds));

    pushToast('Rates and slabs reset to defaults', 'success');
  };

  const calculateInterest = () => {
    // Use our utility function to parse amount that might be in text format
    const depositAmount = parseIndianFormat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      pushToast('Enter a valid principal amount to calculate', 'error');
      return;
    }

    // Validate all interest rates
    const rates = interestRates.map((rate) => parseFloat(rate));
    if (rates.some((rate) => isNaN(rate) || rate < 0)) {
      pushToast('Every slab needs a valid interest rate', 'error');
      return;
    }

    // Validate time period
    const periodValue = parseFloat(timePeriod.value);
    if (isNaN(periodValue) || periodValue <= 0) {
      pushToast('Enter a valid time period', 'error');
      return;
    }

    // Get current tiers based on thresholds
    const currentTiers = getCurrentTiers();

    let remainingAmount = depositAmount;
    let totalInterest = 0;
    const tierBreakdown = [];

    if (isCompound) {
      // Calculate compound interest for each tier
      for (let i = 0; i < currentTiers.length; i++) {
        const tier = currentTiers[i];
        const rate = rates[i];
        const prevTierMax = i === 0 ? 0 : currentTiers[i - 1].maxAmount;

        // Calculate the amount in this tier
        const tierMax = tier.maxAmount;
        const tierLimit = tierMax - prevTierMax;
        const amountInTier = Math.min(remainingAmount, tierLimit);

        if (amountInTier <= 0) break;

        // Determine number of compounds per year
        let compoundsPerYear;
        switch (compoundFrequency) {
          case 'monthly':
            compoundsPerYear = 12;
            break;
          case 'quarterly':
            compoundsPerYear = 4;
            break;
          case 'semi-annually':
            compoundsPerYear = 2;
            break;
          case 'annually':
          default:
            compoundsPerYear = 1;
            break;
        }

        // Calculate time in years
        let timeInYears;
        switch (timePeriod.unit) {
          case 'day':
            timeInYears = periodValue / 365;
            break;
          case 'month':
            timeInYears = periodValue / 12;
            break;
          case 'quarter':
            timeInYears = periodValue / 4;
            break;
          case 'year':
          default:
            timeInYears = periodValue;
            break;
        }

        // Calculate compound interest: P(1 + r/n)^(nt) - P
        const rateDecimal = rate / 100;
        const compoundFactor = Math.pow(
          1 + rateDecimal / compoundsPerYear,
          compoundsPerYear * timeInYears
        );
        const finalAmount = amountInTier * compoundFactor;
        const tierInterest = finalAmount - amountInTier;

        totalInterest += tierInterest;

        // Add to breakdown
        tierBreakdown.push({
          tier: tier.name,
          amount: amountInTier,
          rate: rate,
          interest: tierInterest,
        });

        // Reduce remaining amount
        remainingAmount -= amountInTier;

        if (remainingAmount <= 0) break;
      }
    } else {
      // Calculate simple interest for each tier
      for (let i = 0; i < currentTiers.length; i++) {
        const tier = currentTiers[i];
        const rate = rates[i];
        const prevTierMax = i === 0 ? 0 : currentTiers[i - 1].maxAmount;

        // Calculate the amount in this tier
        const tierMax = tier.maxAmount;
        const tierLimit = tierMax - prevTierMax;
        const amountInTier = Math.min(remainingAmount, tierLimit);

        if (amountInTier <= 0) break;

        // Calculate interest for this tier based on time period
        let periodFactor;
        switch (timePeriod.unit) {
          case 'day':
            periodFactor = periodValue / 365; // Using 365 days in a year
            break;
          case 'month':
            periodFactor = periodValue / 12;
            break;
          case 'quarter':
            periodFactor = periodValue / 4;
            break;
          case 'year':
          default:
            periodFactor = periodValue;
            break;
        }

        // Calculate interest based on the annual rate
        const annualInterest = amountInTier * (rate / 100);
        const periodInterest = annualInterest * periodFactor;
        totalInterest += periodInterest;

        // Add to breakdown
        tierBreakdown.push({
          tier: tier.name,
          amount: amountInTier,
          rate: rate,
          interest: periodInterest,
        });

        // Reduce remaining amount
        remainingAmount -= amountInTier;

        if (remainingAmount <= 0) break;
      }
    }

    // Calculate effective interest rate (annualized)
    const effectiveRate = (totalInterest / depositAmount) * 100;

    // Adjust effective rate to annual rate based on the time period
    let annualizationFactor;
    switch (timePeriod.unit) {
      case 'day':
        annualizationFactor = 365 / periodValue;
        break;
      case 'month':
        annualizationFactor = 12 / periodValue;
        break;
      case 'quarter':
        annualizationFactor = 4 / periodValue;
        break;
      case 'year':
      default:
        annualizationFactor = 1 / periodValue;
        break;
    }

    // Only annualize if the period is not 1 year
    const annualizedEffectiveRate =
      timePeriod.unit === 'year' && parseFloat(timePeriod.value) === 1
        ? effectiveRate
        : effectiveRate * annualizationFactor;

    const newResult = {
      seq: Date.now(),
      depositAmount,
      tierBreakdown,
      totalInterest,
      effectiveRate: annualizedEffectiveRate,
      totalAmount: depositAmount + totalInterest,
      date: new Date().toLocaleString(),
      rates: [...interestRates], // Save the rates used for this calculation
      thresholds: [...tierThresholds], // Save the thresholds used for this calculation
      timePeriod: { ...timePeriod }, // Save the time period used for this calculation
      isCompound, // Save whether compound interest was used
      compoundFrequency: isCompound ? compoundFrequency : null, // Save compound frequency if applicable
    };

    setResult(newResult);

    // Save calculation to history
    const updatedCalculations = [newResult, ...savedCalculations].slice(0, 10); // Keep only last 10 calculations
    setSavedCalculations(updatedCalculations);
    localStorage.setItem('calculations', JSON.stringify(updatedCalculations));
  };

  const clearHistory = () => {
    setSavedCalculations([]);
    localStorage.removeItem('calculations');
    pushToast('Saved calculations cleared', 'success');
  };

  // Apply rates, amount, thresholds, time period, and interest type from a previous calculation
  const applyFromHistory = (calc) => {
    if (calc.rates) {
      setInterestRates(calc.rates);
      localStorage.setItem('interestRates', JSON.stringify(calc.rates));
    }

    if (calc.thresholds) {
      setTierThresholds(calc.thresholds);
      localStorage.setItem('tierThresholds', JSON.stringify(calc.thresholds));
    }

    if (calc.timePeriod) {
      setTimePeriod(calc.timePeriod);
      localStorage.setItem('timePeriod', JSON.stringify(calc.timePeriod));
    }

    // Apply compound interest settings if available
    if (Object.prototype.hasOwnProperty.call(calc, 'isCompound')) {
      setIsCompound(calc.isCompound);

      if (calc.compoundFrequency) {
        setCompoundFrequency(calc.compoundFrequency);
      }
    }

    setAmount(calc.depositAmount.toString());
    localStorage.setItem('amount', calc.depositAmount.toString());

    // Hide history panel after selection
    setShowHistory(false);
    setShowSavedCalculations(false);
    pushToast('Saved values loaded into the form', 'success');
  };

  const copyResult = async () => {
    if (!result) return;
    const summary = [
      `Principal ₹${formatIndianAmount(result.depositAmount)}`,
      `${result.isCompound ? 'Compound' : 'Simple'} interest over ${formatTenure(
        result.timePeriod
      )}`,
      `Earned ₹${formatIndianAmount(result.totalInterest)}`,
      `Total ₹${formatIndianAmount(result.totalAmount)}`,
      `Effective rate ${round2(result.effectiveRate)}% p.a.`,
    ].join(' · ');

    try {
      await navigator.clipboard.writeText(summary);
      pushToast('Result summary copied', 'success');
    } catch {
      pushToast('Clipboard is not available in this browser', 'error');
    }
  };

  /* ---------------- Derived display values ---------------- */
  const parsedAmount = parseIndianFormat(amount);
  const principalEcho =
    amount && !isNaN(parsedAmount) && parsedAmount > 0
      ? parsedAmount >= 100000
        ? `≈ ${formatIndianAmount(parsedAmount, 'text')}`
        : `≈ ₹${formatIndianAmount(parsedAmount)}`
      : 'Enter an amount';

  const animatedInterest = useAnimatedNumber(result ? result.totalInterest : 0);
  const animatedPrincipal = useAnimatedNumber(result ? result.depositAmount : 0);
  const animatedTotal = useAnimatedNumber(result ? result.totalAmount : 0);

  const principalPct = result
    ? (result.depositAmount / result.totalAmount) * 100
    : 100;
  const interestPct = result ? 100 - principalPct : 0;

  const toastIcons = {
    success: ICONS.check,
    error: ICONS.alert,
    info: ICONS.info,
  };

  return (
    <div className="calculator-container">
      <form
        className="card form-card"
        onSubmit={(event) => {
          event.preventDefault();
          calculateInterest();
        }}
        noValidate
      >
        <div className="card-head">
          <div className="card-head-text">
            <span className="eyebrow">Parameters</span>
            <h2>Set up your calculation</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={resetToDefaults}
            aria-label="Reset rates and slabs to defaults"
            title="Reset rates and slabs"
          >
            {ICONS.reset}
          </button>
        </div>

        <div className="field-block">
          <div className="field-head">
            <label htmlFor="amount">Principal amount</label>
            <span className="field-echo">{principalEcho}</span>
          </div>
          <div className="input-shell input-shell-lg">
            <span className="affix affix-start" aria-hidden="true">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              id="amount"
              value={amount}
              onChange={(event) => updateAmount(event.target.value)}
              placeholder="e.g. 500000"
            />
          </div>
        </div>

        <div className="field-block">
          <span className="field-label" id="interest-type-label">
            Interest type
          </span>
          <div
            className="segmented"
            data-count="2"
            role="radiogroup"
            aria-labelledby="interest-type-label"
          >
            <label className="seg">
              <input
                type="radio"
                name="interest-type"
                value="simple"
                checked={!isCompound}
                onChange={() => setIsCompound(false)}
              />
              <span>Simple</span>
            </label>
            <label className="seg">
              <input
                type="radio"
                name="interest-type"
                value="compound"
                checked={isCompound}
                onChange={() => setIsCompound(true)}
              />
              <span>Compound</span>
            </label>
            <span className="seg-indicator" aria-hidden="true" />
          </div>
          <p className="field-hint">
            {isCompound
              ? 'Interest earns interest on top of itself across the tenure.'
              : 'Interest is paid on the principal only — straightforward and predictable.'}
          </p>
        </div>

        <div className="field-block">
          <div className="field-head">
            <span className="field-label" id="rate-slabs-label">
              Rate slabs
            </span>
            <span className="field-echo">{tierThresholds.length} slabs</span>
          </div>

          <ul className="tier-list" aria-labelledby="rate-slabs-label">
            {getCurrentTiers().map((tier, index) => (
              <li className="tier-row" key={index}>
                <div className="tier-head">
                  <span
                    className="tier-dot"
                    style={{
                      backgroundColor: `var(--tier-${(index % 6) + 1})`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="tier-name">{tier.name}</span>
                  {index !== tierThresholds.length - 1 && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-quiet"
                      onClick={() => removeTier(index)}
                      title="Remove this slab"
                      aria-label={`Remove slab ${tier.name}`}
                    >
                      {ICONS.close}
                    </button>
                  )}
                </div>

                <div className="tier-inputs">
                  {index !== tierThresholds.length - 1 ? (
                    <div className="input-shell">
                      <span className="affix affix-start" aria-hidden="true">
                        ₹
                      </span>
                      <label className="visually-hidden" htmlFor={`threshold-${index}`}>
                        Upper limit for slab {index + 1}
                      </label>
                      <input
                        id={`threshold-${index}`}
                        type="text"
                        inputMode="numeric"
                        value={tierThresholds[index]}
                        onChange={(event) =>
                          updateTierThreshold(index, event.target.value)
                        }
                        placeholder="Upper limit"
                      />
                    </div>
                  ) : (
                    <div className="tier-unlimited">
                      <span>No upper limit</span>
                    </div>
                  )}
                  <div className="input-shell input-shell-rate">
                    <label className="visually-hidden" htmlFor={`rate-${index}`}>
                      Interest rate for slab {index + 1}
                    </label>
                    <input
                      id={`rate-${index}`}
                      type="text"
                      inputMode="decimal"
                      value={interestRates[index]}
                      onChange={(event) => updateInterestRate(index, event.target.value)}
                      placeholder="Rate"
                    />
                    <span className="affix affix-end" aria-hidden="true">
                      %
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="tier-actions-row">
            <button
              type="button"
              className="ghost-btn"
              onClick={addTier}
              disabled={tierThresholds.length >= 10}
            >
              {ICONS.plus}
              <span>Add slab</span>
            </button>
            <button type="button" className="ghost-btn" onClick={resetToDefaults}>
              {ICONS.reset}
              <span>Reset</span>
            </button>
          </div>
        </div>

        {isCompound && (
          <div className="field-block field-block-enter">
            <span className="field-label" id="frequency-label">
              Compounding frequency
            </span>
            <div
              className="segmented segmented-sm"
              data-count="4"
              role="radiogroup"
              aria-labelledby="frequency-label"
            >
              {COMPOUND_OPTIONS.map((option) => (
                <label className="seg" key={option.value}>
                  <input
                    type="radio"
                    name="compound-frequency"
                    value={option.value}
                    checked={compoundFrequency === option.value}
                    onChange={() => setCompoundFrequency(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              <span className="seg-indicator" aria-hidden="true" />
            </div>
          </div>
        )}

        <div className="field-block">
          <span className="field-label" id="period-label">
            Time period
          </span>
          <div className="tenure-row">
            <div className="input-shell input-shell-period">
              <label className="visually-hidden" htmlFor="period-value">
                Period value
              </label>
              <input
                id="period-value"
                type="text"
                inputMode="decimal"
                value={timePeriod.value}
                onChange={(event) => updateTimePeriodValue(event.target.value)}
              />
              <span className="affix affix-end" aria-hidden="true">
                {timePeriod.unit === 'year'
                  ? 'yr'
                  : timePeriod.unit === 'month'
                    ? 'mo'
                    : timePeriod.unit === 'quarter'
                      ? 'qtr'
                      : 'day'}
              </span>
            </div>
            <div
              className="segmented segmented-sm"
              data-count="4"
              role="radiogroup"
              aria-label="Period unit"
            >
              {UNIT_OPTIONS.map((option) => (
                <label className="seg" key={option.value}>
                  <input
                    type="radio"
                    name="period-unit"
                    value={option.value}
                    checked={timePeriod.unit === option.value}
                    onChange={() => updateTimePeriodUnit(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              <span className="seg-indicator" aria-hidden="true" />
            </div>
          </div>
        </div>

        <button type="submit" className="cta-btn">
          <span>Calculate returns</span>
          {ICONS.arrow}
        </button>
      </form>

      {result && (
        <section className="card result-container" aria-label="Calculation result">
          <div className="card-head">
            <div className="card-head-text">
              <span className="eyebrow">Result</span>
              <h2>Your returns</h2>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={copyResult}
              aria-label="Copy result summary"
              title="Copy summary"
            >
              {ICONS.copy}
            </button>
          </div>

          <div className="stat-grid" key={result.seq}>
            <div className="stat stat-positive">
              <span className="stat-icon">{ICONS.trend}</span>
              <span className="stat-label">Interest earned</span>
              <span className="stat-value">₹{formatStat(animatedInterest)}</span>
              <span className="stat-sub">{round2(result.effectiveRate)}% p.a. effective</span>
            </div>
            <div className="stat">
              <span className="stat-icon">{ICONS.wallet}</span>
              <span className="stat-label">Principal</span>
              <span className="stat-value">₹{formatStat(animatedPrincipal)}</span>
              <span className="stat-sub">{formatTenure(result.timePeriod)}</span>
            </div>
            <div className="stat stat-brand stat-total">
              <span className="stat-icon">{ICONS.gem}</span>
              <span className="stat-label">Total value</span>
              <span className="stat-value">₹{formatStat(animatedTotal)}</span>
              <span className="stat-sub">
                {result.isCompound ? 'Compound' : 'Simple'} interest
              </span>
            </div>
          </div>

          <div className="growth" key={`growth-${result.seq}`}>
            <div
              className="growth-bar"
              role="img"
              aria-label={`Principal is ${round2(principalPct)} percent, interest is ${round2(
                interestPct
              )} percent of the total value`}
            >
              <span className="growth-seg growth-principal" style={{ width: `${principalPct}%` }} />
              <span className="growth-seg growth-interest" style={{ width: `${interestPct}%` }} />
            </div>
            <div className="growth-legend">
              <span>
                <i className="dot dot-principal" />
                Principal · {round2(principalPct)}%
              </span>
              <span>
                <i className="dot dot-interest" />
                Interest · {round2(interestPct)}%
              </span>
            </div>
          </div>

          <p className="visually-hidden" role="status">
            Calculation complete. Interest ₹{formatIndianAmount(result.totalInterest)},
            total value ₹{formatIndianAmount(result.totalAmount)}.
          </p>

          <button
            type="button"
            className="details-toggle"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
          >
            <span>{showHistory ? 'Hide details' : 'View details'}</span>
            <span className={`details-chevron${showHistory ? ' is-open' : ''}`} aria-hidden="true">
              {ICONS.chevron}
            </span>
          </button>

          {showHistory && (
            <div className="result-details">
              <div className="tabs" role="tablist" aria-label="Result details">
                <button
                  type="button"
                  role="tab"
                  className={`tab-btn${!showSavedCalculations ? ' active' : ''}`}
                  aria-selected={!showSavedCalculations}
                  onClick={() => setShowSavedCalculations(false)}
                >
                  Current calculation
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`tab-btn${showSavedCalculations ? ' active' : ''}`}
                  aria-selected={showSavedCalculations}
                  onClick={() => setShowSavedCalculations(true)}
                >
                  Saved ({savedCalculations.length})
                </button>
              </div>

              {!showSavedCalculations ? (
                <div className="details-stack">
                  <dl className="detail-list">
                    <div className="detail-row">
                      <dt>Interest type</dt>
                      <dd>{result.isCompound ? 'Compound interest' : 'Simple interest'}</dd>
                    </div>
                    {result.isCompound && result.compoundFrequency && (
                      <div className="detail-row">
                        <dt>Compounding</dt>
                        <dd className="capitalize">{result.compoundFrequency}</dd>
                      </div>
                    )}
                    <div className="detail-row">
                      <dt>Time period</dt>
                      <dd>{formatTenure(result.timePeriod)}</dd>
                    </div>
                    <div className="detail-row">
                      <dt>Effective annual rate</dt>
                      <dd>{round2(result.effectiveRate)}%</dd>
                    </div>
                  </dl>

                  <div className="details-section">
                    <div className="section-title">
                      <h3>Interest breakdown</h3>
                      <div className="tier-stack" aria-hidden="true">
                        {result.tierBreakdown.map((tier, index) => (
                          <span
                            key={index}
                            className="tier-stack-seg"
                            title={tier.tier}
                            style={{
                              width: `${(tier.amount / result.depositAmount) * 100}%`,
                              backgroundColor: `var(--tier-${(index % 6) + 1})`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="table-scroll">
                      <table className="breakdown-table">
                        <caption className="visually-hidden">
                          Principal and interest earned per rate slab
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Slab</th>
                            <th scope="col" className="num">
                              Amount
                            </th>
                            <th scope="col" className="num">
                              Rate
                            </th>
                            <th scope="col" className="num">
                              Interest
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.tierBreakdown.map((tier, index) => (
                            <tr key={index}>
                              <th scope="row" className="cell-slab">
                                <span
                                  className="tier-dot"
                                  style={{
                                    backgroundColor: `var(--tier-${(index % 6) + 1})`,
                                  }}
                                  aria-hidden="true"
                                />
                                <span className="cell-slab-text">{tier.tier}</span>
                              </th>
                              <td className="num">₹{formatStat(tier.amount)}</td>
                              <td className="num">{tier.rate}%</td>
                              <td className="num cell-interest">
                                +₹{formatStat(tier.interest)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="saved-calculations">
                  <div className="saved-header">
                    <h3>Saved calculations</h3>
                    {savedCalculations.length > 0 && (
                      <button type="button" className="ghost-btn ghost-btn-danger" onClick={clearHistory}>
                        {ICONS.close}
                        <span>Clear history</span>
                      </button>
                    )}
                  </div>

                  {savedCalculations.length === 0 ? (
                    <p className="empty-state">
                      No saved calculations yet — run one and it lands here.
                    </p>
                  ) : (
                    <ul className="history-list">
                      {savedCalculations.map((calc, index) => (
                        <li key={index} className="history-item">
                          <div className="history-item-top">
                            <span className="history-amount">
                              ₹{formatIndianAmount(calc.depositAmount)}
                            </span>
                            <span className="history-date">{calc.date}</span>
                          </div>

                          <div className="history-chips">
                            <span className="chip">{formatTenure(calc.timePeriod)}</span>
                            {typeof calc.isCompound === 'boolean' && (
                              <span className="chip chip-accent">
                                {calc.isCompound ? 'Compound' : 'Simple'}
                              </span>
                            )}
                            <span className="chip chip-positive">
                              +₹{formatIndianAmount(calc.totalInterest)}
                            </span>
                          </div>

                          <div className="history-item-bottom">
                            <span className="history-total">
                              ₹{formatIndianAmount(calc.totalAmount)}
                            </span>
                            <button
                              type="button"
                              className="ghost-btn"
                              onClick={() => applyFromHistory(calc)}
                            >
                              <span>Apply values</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <span className="toast-icon">{toastIcons[toast.tone] || ICONS.info}</span>
            <span className="toast-msg">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              {ICONS.close}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InterestCalculator;
