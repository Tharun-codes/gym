/**
 * FLEXFORGE FITNESS - UPGRADED FRONTEND LOGIC
 * Features: Sticky Header, Mobile Menu, Scroll Reveal, Dynamic Pricing Switch, Interactive BMI Sliders, Lead capture modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. STICKY HEADER & SCROLL SHADOW
  // ==========================================================================
  const header = document.getElementById('site-header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ==========================================================================
  // 2. SCROLL REVEAL (INTERSECTION OBSERVER)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, no need to track it further
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15, // trigger when 15% of the element is visible
    rootMargin: '0px 0px -50px 0px' // adjust vertical trigger point
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // ==========================================================================
  // 3. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  const navToggle = document.getElementById('nav-toggle');
  const siteNavbar = document.getElementById('site-navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && siteNavbar) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      siteNavbar.classList.toggle('active');
    });

    // Close menu when clicking a nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        siteNavbar.classList.remove('active');
      });
    });
  }

  // ==========================================================================
  // 4. MEMBERSHIP DYNAMIC BILLING TOGGLE (MONTHLY VS YEARLY)
  // ==========================================================================
  const billingToggle = document.getElementById('billing-toggle');
  const toggleMonthlyLabel = document.getElementById('toggle-monthly');
  const toggleYearlyLabel = document.getElementById('toggle-yearly');
  
  const priceElements = document.querySelectorAll('.price');
  const billingCycleTexts = document.querySelectorAll('.tier-billing');
  const pricingCtaButtons = document.querySelectorAll('.pricing-card .open-booking-modal-btn');

  if (billingToggle) {
    billingToggle.addEventListener('click', () => {
      const isYearly = billingToggle.classList.toggle('toggled');
      
      // Update toggle labels highlighting
      if (isYearly) {
        toggleYearlyLabel.classList.add('active');
        toggleMonthlyLabel.classList.remove('active');
      } else {
        toggleMonthlyLabel.classList.add('active');
        toggleYearlyLabel.classList.remove('active');
      }

      // Update pricing card details
      priceElements.forEach(priceEl => {
        // Add subtle scale out-in transition effect on values
        priceEl.classList.add('animate');
        
        setTimeout(() => {
          const newPrice = isYearly 
            ? priceEl.getAttribute('data-price-yearly') 
            : priceEl.getAttribute('data-price-monthly');
          priceEl.textContent = newPrice;
          priceEl.classList.remove('animate');
        }, 150);
      });

      // Update billing sub-labels
      billingCycleTexts.forEach(billingTextEl => {
        const newBillingLabel = isYearly
          ? billingTextEl.getAttribute('data-billing-yearly')
          : billingTextEl.getAttribute('data-billing-monthly');
        billingTextEl.textContent = newBillingLabel;
      });

      // Update CTA modal attributes so form dropdown maps to correct pre-selection
      pricingCtaButtons.forEach(btn => {
        const currentPlan = btn.getAttribute('data-plan');
        let updatedPlan = currentPlan;
        
        if (isYearly) {
          // Map to yearly plan options
          if (currentPlan.includes('Monthly')) updatedPlan = 'Monthly Membership ($49/mo)'; // Or keep as is, but billed yearly options
          if (currentPlan.includes('Quarterly')) updatedPlan = 'Quarterly Membership ($39/mo)';
          if (currentPlan.includes('Annual')) updatedPlan = 'Annual Membership ($29/mo)';
        } else {
          // Map to monthly plan options
          if (currentPlan.includes('Monthly')) updatedPlan = 'Monthly Membership ($49/mo)';
          if (currentPlan.includes('Quarterly')) updatedPlan = 'Quarterly Membership ($39/mo)';
          if (currentPlan.includes('Annual')) updatedPlan = 'Annual Membership ($29/mo)';
        }
        btn.setAttribute('data-plan', updatedPlan);
      });
    });
  }

  // ==========================================================================
  // 5. LEAD CAPTURE MODAL LOGIC
  // ==========================================================================
  const bookingModal = document.getElementById('booking-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const openModalBtns = document.querySelectorAll('.open-booking-modal-btn');
  const leadPlanSelect = document.getElementById('lead-plan');
  const leadForm = document.getElementById('lead-form');
  
  // Alert containers
  const errorAlert = document.getElementById('form-error-alert');
  const successAlert = document.getElementById('form-success-alert');
  const errorMessageText = document.getElementById('error-message-text');
  
  // Submit state elements
  const submitBtn = document.getElementById('lead-submit-btn');
  const submitSpinner = document.getElementById('submit-spinner');

  // Open Modal handler
  document.body.addEventListener('click', (e) => {
    // Event delegation to catch dynamic plan adjustments on pricing card clicks
    const btn = e.target.closest('.open-booking-modal-btn');
    if (!btn) return;
    
    e.preventDefault();
    
    // Auto-select plan if the button provides a plan attribute
    const selectedPlan = btn.getAttribute('data-plan');
    if (selectedPlan && leadPlanSelect) {
      leadPlanSelect.value = selectedPlan;
    }
    
    // Reset form states
    resetFormAlerts();
    
    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
  });

  // Close Modal handler
  const closeModal = () => {
    bookingModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore background scrolling
    resetFormAlerts();
    leadForm.reset();
  };

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking outside the container
  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      closeModal();
    }
  });

  // Esc key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
      closeModal();
    }
  });

  function resetFormAlerts() {
    if (errorAlert) errorAlert.classList.add('hidden');
    if (successAlert) successAlert.classList.add('hidden');
  }

  // ==========================================================================
  // 6. DUAL-INPUT BMI CALCULATOR (SLIDERS & REAL-TIME UPDATES)
  // ==========================================================================
  const bmiForm = document.getElementById('bmi-form');
  const bmiHeightInput = document.getElementById('bmi-height');
  const bmiHeightSlider = document.getElementById('bmi-height-slider');
  const heightValDisplay = document.getElementById('height-val');
  
  const bmiWeightInput = document.getElementById('bmi-weight');
  const bmiWeightSlider = document.getElementById('bmi-weight-slider');
  const weightValDisplay = document.getElementById('weight-val');

  const bmiResultBox = document.getElementById('bmi-result-box');
  const bmiValueSpan = document.getElementById('bmi-value');
  const bmiCategoryBadge = document.getElementById('bmi-category');
  const bmiSuggestion = document.getElementById('bmi-suggestion');

  // Calculates and updates UI BMI components immediately
  const calculateBMI = () => {
    const height = parseFloat(bmiHeightInput.value);
    const weight = parseFloat(bmiWeightInput.value);

    if (!height || !weight || height <= 0 || weight <= 0) {
      return;
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmiScore = bmi.toFixed(1);

    // Display score
    bmiValueSpan.textContent = bmiScore;

    // Reset category classes
    bmiCategoryBadge.className = 'bmi-category-badge';

    let category = '';
    let badgeClass = '';
    let suggestion = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      badgeClass = 'underweight';
      suggestion = 'Focus on building lean muscle mass through nutrient-dense meals and structured strength training.';
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Normal Weight';
      badgeClass = 'normal';
      suggestion = 'Fantastic! You are within a healthy index range. Maintain peak performance with consistent weight lifting and high protein diets.';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      badgeClass = 'overweight';
      suggestion = 'Incorporate routine strength training coupled with high-intensity interval conditioning and a small caloric deficit.';
    } else {
      category = 'Obese';
      badgeClass = 'obese';
      suggestion = 'Consult a personal coach to design custom, low-impact exercise routines combined with guided nutritional protocols.';
    }

    bmiCategoryBadge.textContent = category;
    bmiCategoryBadge.classList.add(badgeClass);
    bmiSuggestion.textContent = suggestion;

    // Ensure the results box is revealed
    bmiResultBox.classList.remove('hidden');
  };

  // Sync inputs helper
  const syncInputs = (numInput, rangeInput, displaySpan) => {
    const val = rangeInput.value;
    numInput.value = val;
    displaySpan.textContent = val;
    calculateBMI();
  };

  // Attach sync events to Height controls
  if (bmiHeightSlider && bmiHeightInput) {
    // Slider moved
    bmiHeightSlider.addEventListener('input', () => {
      syncInputs(bmiHeightInput, bmiHeightSlider, heightValDisplay);
    });
    // Number typed
    bmiHeightInput.addEventListener('input', () => {
      // Validate bounds
      let val = parseInt(bmiHeightInput.value);
      if (isNaN(val)) return;
      if (val < 100) val = 100;
      if (val > 250) val = 250;
      
      bmiHeightSlider.value = val;
      heightValDisplay.textContent = val;
      calculateBMI();
    });
  }

  // Attach sync events to Weight controls
  if (bmiWeightSlider && bmiWeightInput) {
    // Slider moved
    bmiWeightSlider.addEventListener('input', () => {
      syncInputs(bmiWeightInput, bmiWeightSlider, weightValDisplay);
    });
    // Number typed
    bmiWeightInput.addEventListener('input', () => {
      let val = parseInt(bmiWeightInput.value);
      if (isNaN(val)) return;
      if (val < 30) val = 30;
      if (val > 200) val = 200;
      
      bmiWeightSlider.value = val;
      weightValDisplay.textContent = val;
      calculateBMI();
    });
  }

  // Prevent default reload on submit click, run calculation just in case
  if (bmiForm) {
    bmiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateBMI();
    });
    
    // Initial run on page load
    calculateBMI();
  }

  // ==========================================================================
  // 7. ASYNCHRONOUS LEAD CAPTURE FORM SUBMISSION (API INTEGRATION)
  // ==========================================================================
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetFormAlerts();

      const nameInput = document.getElementById('lead-name');
      const phoneInput = document.getElementById('lead-phone');
      
      const nameVal = nameInput.value.trim();
      const phoneVal = phoneInput.value.trim();
      const planVal = leadPlanSelect.value;

      // Client-Side Validation
      const errors = [];
      if (nameVal.length < 2) {
        errors.push('Full name must be at least 2 characters.');
      }
      
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(phoneVal)) {
        errors.push('Enter a valid phone number (minimum 7 digits).');
      }
      
      if (!planVal) {
        errors.push('Please select a membership plan.');
      }

      if (errors.length > 0) {
        errorMessageText.textContent = errors.join(' ');
        errorAlert.classList.remove('hidden');
        return;
      }

      const payload = {
        name: nameVal,
        phone: phoneVal,
        plan_selected: planVal
      };

      // Set Loading State
      submitBtn.disabled = true;
      submitSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/api/book-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          successAlert.querySelector('span').textContent = data.message;
          successAlert.classList.remove('hidden');
          leadForm.reset();
          
          setTimeout(() => {
            closeModal();
          }, 3000);
        } else {
          let errMsg = data.message || 'An error occurred during booking. Please try again.';
          if (data.errors && Array.isArray(data.errors)) {
            errMsg = data.errors.join(' ');
          }
          errorMessageText.textContent = errMsg;
          errorAlert.classList.remove('hidden');
        }
      } catch (err) {
        console.error('API submission failed:', err);
        errorMessageText.textContent = 'Could not connect to the booking service. Please check your connection and try again.';
        errorAlert.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitSpinner.classList.add('hidden');
      }
    });
  }
});
