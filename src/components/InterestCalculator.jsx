import { useState, useEffect, useMemo } from 'react';
import './InterestCalculator.css';
// Import All Functions 
import { parseIndianFormat, formatIndianAmount } from '../func/InterestCalculatorFunc';


function InterestCalculator() {
  // Default values
  const defaultRates = useMemo(() => ['4.00', '6.25', '7.50', '7.75'], []);
  const defaultThresholds = useMemo(() => ['100000', '500000', '500000000', 'Infinity'], []);

  // State variables
  const [amount, setAmount] = useState('');
  const [interestRates, setInterestRates] = useState(defaultRates);
  const [tierThresholds, setTierThresholds] = useState(defaultThresholds);
  const [timePeriod, setTimePeriod] = useState({
    value: '1',
    unit: 'year'
  });
  const [isCompound, setIsCompound] = useState(false);
  const [compoundFrequency, setCompoundFrequency] = useState('annually');
  const [result, setResult] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedCalculations, setShowSavedCalculations] = useState(false);

  // Generate tier names based on thresholds
  const getTierNames = (thresholds) => {
    const names = [];
    for (let i = 0; i < thresholds.length; i++) {
      if (i === 0) {
        names.push(`Upto ₹${formatAmount(thresholds[i])}`);
      } else if (thresholds[i] === 'Infinity') {
        names.push(`Above ₹${formatAmount(thresholds[i-1])}`);
      } else {
        names.push(`Above ₹${formatAmount(thresholds[i-1])} upto ₹${formatAmount(thresholds[i])}`);
      }
    }
    return names;
  };

  // Format amount for display
  const formatAmount = (amount) => {
    // Use our utility function
    return formatIndianAmount(amount, 'text').replace('₹', '');
  };

  // Get current tiers based on thresholds
  const getCurrentTiers = () => {
    return tierThresholds.map((threshold, index) => {
      const value = threshold === 'Infinity' ? Infinity : parseFloat(threshold);
      return {
        maxAmount: value,
        name: getTierNames(tierThresholds)[index]
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
      alert('Maximum 10 tiers allowed');
      return;
    }

    // Get the last non-infinity threshold and suggest a higher value
    const lastThresholdValue = parseFloat(tierThresholds[tierThresholds.length - 2]) || 100000;
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
      alert('Minimum 1 tier required');
      return;
    }

    // Don't allow removing the Infinity tier
    if (index === tierThresholds.length - 1) {
      alert('Cannot remove the highest tier');
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

    alert('Reset to default interest rates and tiers');
  };

  const calculateInterest = () => {
    // Use our utility function to parse amount that might be in text format
    const depositAmount = parseIndianFormat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Validate all interest rates
    const rates = interestRates.map(rate => parseFloat(rate));
    if (rates.some(rate => isNaN(rate) || rate < 0)) {
      alert('Please enter valid interest rates');
      return;
    }

    // Validate time period
    const periodValue = parseFloat(timePeriod.value);
    if (isNaN(periodValue) || periodValue <= 0) {
      alert('Please enter a valid time period');
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
        const prevTierMax = i === 0 ? 0 : currentTiers[i-1].maxAmount;

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
        const compoundFactor = Math.pow(1 + (rateDecimal / compoundsPerYear), compoundsPerYear * timeInYears);
        const finalAmount = amountInTier * compoundFactor;
        const tierInterest = finalAmount - amountInTier;

        totalInterest += tierInterest;

        // Add to breakdown
        tierBreakdown.push({
          tier: tier.name,
          amount: amountInTier,
          rate: rate,
          interest: tierInterest
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
        const prevTierMax = i === 0 ? 0 : currentTiers[i-1].maxAmount;

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
          interest: periodInterest
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
      (timePeriod.unit === 'year' && parseFloat(timePeriod.value) === 1) ?
        effectiveRate : effectiveRate * annualizationFactor;

    const newResult = {
      depositAmount,
      tierBreakdown,
      totalInterest,
      effectiveRate: annualizedEffectiveRate,
      totalAmount: depositAmount + totalInterest,
      date: new Date().toLocaleString(),
      rates: [...interestRates], // Save the rates used for this calculation
      thresholds: [...tierThresholds], // Save the thresholds used for this calculation
      timePeriod: {...timePeriod}, // Save the time period used for this calculation
      isCompound, // Save whether compound interest was used
      compoundFrequency: isCompound ? compoundFrequency : null // Save compound frequency if applicable
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
  };

  return (
    <div className="calculator-container">
      {/* <h2>Interest Calculator</h2> */}

      <div className="calculator-form">
        <div className="form-row">
          <label htmlFor="amount">Principal Amount (₹{amount || '0'})</label>
          <div className="input-with-icon">
            <span className="input-icon">₹</span>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => updateAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="form-row">
          <label>Annual Rate</label>
          <div className="rate-inputs-container">
            {getCurrentTiers().map((tier, index) => (
              <div key={index} className="rate-tier">
                <div className="tier-info">
                  <div className="tier-label">{tier.name}</div>
                  {index !== tierThresholds.length - 1 && (
                    <button
                      onClick={() => removeTier(index)}
                      className="remove-tier-btn"
                      title="Remove this tier"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="tier-inputs">
                  {index !== tierThresholds.length - 1 && (
                    <div className="threshold-input">
                      <input
                        type="text"
                        value={tierThresholds[index]}
                        onChange={(e) => updateTierThreshold(index, e.target.value)}
                        placeholder="Threshold"
                      />
                    </div>
                  )}
                  <div className="input-with-icon">
                    <input
                      type="text"
                      value={interestRates[index]}
                      onChange={(e) => updateInterestRate(index, e.target.value)}
                      step="0.01"
                      min="0"
                    />
                    <span className="input-icon-right">%</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="tier-actions">
              <button onClick={addTier} className="small-btn add-btn" title="Add a tier">+</button>
              <button onClick={resetToDefaults} className="small-btn reset-btn" title="Reset tiers">↺</button>
            </div>
          </div>
        </div>

        {isCompound && (
          <div className="form-row">
            <label>Compounding Frequency</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="compound-frequency"
                  value="annually"
                  checked={compoundFrequency === 'annually'}
                  onChange={() => setCompoundFrequency('annually')}
                />
                <span>Annually</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="compound-frequency"
                  value="semi-annually"
                  checked={compoundFrequency === 'semi-annually'}
                  onChange={() => setCompoundFrequency('semi-annually')}
                />
                <span>Semi-Annually</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="compound-frequency"
                  value="quarterly"
                  checked={compoundFrequency === 'quarterly'}
                  onChange={() => setCompoundFrequency('quarterly')}
                />
                <span>Quarterly</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="compound-frequency"
                  value="monthly"
                  checked={compoundFrequency === 'monthly'}
                  onChange={() => setCompoundFrequency('monthly')}
                />
                <span>Monthly</span>
              </label>
            </div>
          </div>
        )}

        <div className="form-row">
          <label>Period Unit</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="period-unit"
                value="day"
                checked={timePeriod.unit === 'day'}
                onChange={() => updateTimePeriodUnit('day')}
              />
              <span>Days</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="period-unit"
                value="month"
                checked={timePeriod.unit === 'month'}
                onChange={() => updateTimePeriodUnit('month')}
              />
              <span>Months</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="period-unit"
                value="quarter"
                checked={timePeriod.unit === 'quarter'}
                onChange={() => updateTimePeriodUnit('quarter')}
              />
              <span>Quarters</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="period-unit"
                value="year"
                checked={timePeriod.unit === 'year'}
                onChange={() => updateTimePeriodUnit('year')}
              />
              <span>Years</span>
            </label>
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="period-value">Period Value</label>
          <input
            type="text"
            id="period-value"
            value={timePeriod.value}
            onChange={(e) => updateTimePeriodValue(e.target.value)}
            min="0.1"
            step="0.1"
          />
        </div>

        <button onClick={calculateInterest} className="calculate-btn">Calculate</button>
      </div>

      {result && (
        <div className="result-container">
          <div className="result-row">
            <div className="result-label">Interest Earned</div>
            <div className="result-value">₹{formatIndianAmount(result.totalInterest)}</div>
          </div>
          <div className="result-row">
            <div className="result-label">Principal Amount</div>
            <div className="result-value">₹{formatIndianAmount(result.depositAmount)}</div>
          </div>
          <div className="result-row total">
            <div className="result-label">Total Value</div>
            <div className="result-value">₹{formatIndianAmount(result.totalAmount)}</div>
          </div>

          <button onClick={() => setShowHistory(!showHistory)} className="view-details-btn">
            {showHistory ? 'Hide Details' : 'View Details'}
          </button>

          {showHistory && (
            <div className="result-details">
              <div className="details-tabs">
                <button
                  className={`tab-btn ${!showSavedCalculations ? 'active' : ''}`}
                  onClick={() => setShowSavedCalculations(false)}
                >
                  Current Calculation
                </button>
                <button
                  className={`tab-btn ${showSavedCalculations ? 'active' : ''}`}
                  onClick={() => setShowSavedCalculations(true)}
                >
                  Saved Calculations
                </button>
              </div>

              {!showSavedCalculations ? (
                <>
                  <div className="details-section">
                    <h4>Calculation Details</h4>
                    <div className="detail-row">
                      <span>Interest Type:</span>
                      <span>{result.isCompound ? 'Compound Interest' : 'Simple Interest'}</span>
                    </div>
                    {result.isCompound && (
                      <div className="detail-row">
                        <span>Compounding Frequency:</span>
                        <span>{result.compoundFrequency}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span>Time Period:</span>
                      <span>{result.timePeriod.value} {result.timePeriod.unit}(s)</span>
                    </div>
                    <div className="detail-row">
                      <span>Effective Annual Rate:</span>
                      <span>{Math.round(result.effectiveRate * 100) / 100}%</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Interest Breakdown</h4>
                    <table className="breakdown-table">
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>Amount (₹)</th>
                          <th>Rate (%)</th>
                          <th>Interest (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.tierBreakdown.map((tier, index) => (
                          <tr key={index}>
                            <td>{tier.tier}</td>
                            <td>₹{formatIndianAmount(tier.amount)}</td>
                            <td>{tier.rate}%</td>
                            <td>₹{formatIndianAmount(tier.interest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="saved-calculations">
                  <div className="saved-header">
                    <h4>Saved Calculations</h4>
                    {savedCalculations.length > 0 && (
                      <button onClick={clearHistory} className="clear-history-btn">
                        Clear History
                      </button>
                    )}
                  </div>

                  {savedCalculations.length === 0 ? (
                    <p className="no-history">No saved calculations yet.</p>
                  ) : (
                    <div className="history-list">
                      {savedCalculations.map((calc, index) => (
                        <div key={index} className="history-item">
                          <div className="history-item-header">
                            <span className="history-date">{calc.date}</span>
                            <span className="history-amount">₹{formatIndianAmount(calc.depositAmount)}</span>
                          </div>
                          <div className="history-item-details">
                            <div className="detail-row">
                              <span>Time Period:</span>
                              <span>{calc.timePeriod ? `${calc.timePeriod.value} ${calc.timePeriod.unit}(s)` : '1 year'}</span>
                            </div>
                            <div className="detail-row">
                              <span>Interest:</span>
                              <span>₹{formatIndianAmount(calc.totalInterest)} ({Math.round(calc.effectiveRate * 100) / 100}%)</span>
                            </div>
                            <div className="detail-row">
                              <span>Total:</span>
                              <span>₹{formatIndianAmount(calc.totalAmount)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => applyFromHistory(calc)}
                            className="apply-history-btn"
                          >
                            Apply These Values
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}


    </div>
  );
}

export default InterestCalculator;
