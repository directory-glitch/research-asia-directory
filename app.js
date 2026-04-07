// gabia_deploy/app.js

// ================= DATA FETCHING (Google Sheets Integration) =================
// 3ê³„ì¸µ ?„í‚¤?ì²˜: ?Œì´?¬ì´ ê¸ì–´???°ì´?°ë? êµ¬ê? ?œíŠ¸???¬ë¦° ?? [?Œì¼ > ê³µìœ  > ?¹ì— ê²Œì‹œ(CSV)] ??ì£¼ì†Œë¥??¬ê¸°???£ìœ¼?¸ìš”.
const REAL_DATA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";

let mockAgencies = []; // API/?œíŠ¸?ì„œ ë¶ˆëŸ¬?€ ì±„ì›Œì§??„ì—­ ë°°ì—´

async function fetchRealDataFromGoogleSheet() {
    try {
        // [1] ì¶”í›„ êµ¬ê? ?œíŠ¸ ì£¼ì†Œê°€ ?¸íŒ…?˜ë©´ ??ì£¼ì„???€ê³??¬ìš©?˜ì„¸??
        // const response = await fetch(REAL_DATA_CSV_URL);
        // const csvText = await response.text();
        // mockAgencies = csvParseLogic(csvText); // CSVë¥?JS ê°ì²´ë¡??Œì‹±?˜ëŠ” ì»¤ìŠ¤?€ ë¡œì§

        // [2] ?Œì´???¤í¬ë¦½íŠ¸(execution/clean_esomar_data.py)ê°€ ?ì„±?????°ì´???Œì¼??
        // index.html ?¤ë”??ë¡œë“œ?˜ì—ˆ?¤ë©´ ê·??°ì´?°ë? ?°ì„ ?ìœ¼ë¡??¬ìš©?©ë‹ˆ??
        if (typeof REAL_AGENCIES !== "undefined") {
            mockAgencies = REAL_AGENCIES;
            console.log(`[Log] Successfully loaded ${mockAgencies.length} real agencies from Python Bot.`);
        } 
        // [3] ?„ë¬´ ?°ë™?????˜ì–´?ˆì„ ê²½ìš° ?Œì•„ê°€???ˆë¹„(Mock) ?˜ë“œì½”ë”© ?°ì´??        else {
            console.log("[Log] Fetching placeholder agency data...");
            mockAgencies = [
                {
                    id: "drk", name: "Direct Research Korea (DRK)", tagline: "Specialist in Korea & Japan, SNS-based panel focus",
                    tags: ["Korea", "Japan", "Gen Z", "SNS Panel"], minProjectSize: "$5,000+", rating: 4.9, reviewCount: 142
                },
                {
                    id: "indo", name: "IndoInsights", tagline: "SE Asia specialist, Ethnography expert",
                    tags: ["Indonesia", "Vietnam", "Ethnography"], minProjectSize: "$3,000+", rating: 4.7, reviewCount: 98
                },
                {
                    id: "thai", name: "ThaiGenZ Research", tagline: "Thailand focused, Millennial & Gen Z expert",
                    tags: ["Thailand", "Millennials"], minProjectSize: "$2,500+", rating: 4.8, reviewCount: 65
                },
                {
                    id: "sing", name: "Singapore Strategy Group", tagline: "B2B & Fintech research specialist across Asia",
                    tags: ["Singapore", "B2B", "Fintech"], minProjectSize: "$10,000+", rating: 5.0, reviewCount: 204
                },
                {
                    id: "mekong", name: "Mekong Pulse", tagline: "Indochina region market entry specialist",
                    tags: ["Vietnam", "Cambodia", "FMCG"], minProjectSize: "$2,000+", rating: 4.6, reviewCount: 45
                }
            ];
        }
        
        // ?°ì´??ë¡œë”© ?±ê³µ ???”ë©´ ?”ë©´ ?Œë”ë§??œìž‘
        initApplication();
    } catch(err) {
        console.error("Failed to load real data:", err);
    }
}

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    fetchRealDataFromGoogleSheet(); // ???œìž‘ ??ìµœì´ˆ ?°ì´??ë¡œë”©
});

function initApplication() {
  // ?ëž˜ ?ˆë˜ DOM ë³€??? ì–¸ ë¶€ë¶?  const container = document.getElementById("agency-list");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");



  // Render Function
  const renderList = (data) => {
      if(!container) return; // detail page check
      container.innerHTML = "";
      if (data.length === 0) {
          container.innerHTML = `<div style="text-align:center; padding: 4rem; color: #64748B;">No agencies found. Try another term.</div>`;
          return;
      }

      data.forEach(agency => {
          const tagsHtml = agency.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
          
          const card = document.createElement("a");
          card.href = `agency-detail.html?id=${agency.id}`;
          card.className = "agency-card";
          card.innerHTML = `
              <div class="agency-info">
                  <h3>${agency.name}</h3>
                  <p>${agency.tagline}</p>
                  <div class="tag-list">${tagsHtml}</div>
              </div>
                <div class="agency-stats">
                  <div class="rating" style="color:var(--text-main); font-weight:600; display:flex; align-items:center; gap:6px;">

                    <span>${agency.region || "Asia-Pacific"}</span>
                  </div>
                  <span class="view-btn">View Profile &rarr;</span>
              </div>
          `;
          container.appendChild(card);
      });
  };

  // Initial Render
  if(container) renderList(mockAgencies);

  // ============== DATA TRACKING LOGIC (Webhooks / Google Sheets) ==============
  // ?•ì  ?¸ìŠ¤??ê°€ë¹„ì•„)?ì„œ??DBê°€ ?†ìœ¼ë¯€ë¡?Make(Integromat), Zapier ?ëŠ” êµ¬ê? ?±ìŠ¤ ?¤í¬ë¦½íŠ¸ ?¹í›… URLë¡??°ì´?°ë? ?©ë‹ˆ??
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyh503yBj0iVIO51Z2i7639MYfxNt7kLk0Tbhvdlf5gCmhCzugzPfcFeqkF3Tj84O_IfQ/exec";

  let userLocation = null;

  // 1. ?‘ì† ??GPS(IP ê¸°ë°˜ ì£¼ì†Œ) ?˜ì§‘
  fetch("https://ipapi.co/json/")
    .then(res => res.json())
    .then(data => {
        userLocation = {
            ip: data.ip,
            city: data.city,
            country: data.country_name,
            org: data.org // ê¸°ì—… ?‘ì†ë§??•ì¸??(B2B ?˜ë„ ?°ì´???Œì•… ?µì‹¬)
        };
        
        const urlParams = new URLSearchParams(window.location.search);
        const agencyId = urlParams.get('id');
        
        const pageViewData = {
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer || "direct"
        };
        if (agencyId) {
            pageViewData.agency_id = agencyId;
        }
        
        sendTrackingData("page_view", pageViewData);
    })
    .catch(err => console.error("Location tracking blocked/failed"));

  // ?¸ëž˜???„ì†¡ ê³µí†µ ?¨ìˆ˜ (?„ì—­ ?¸ì¶œ)
  const sendTrackingData = (eventType, payload) => {
      const dataToLog = {
          event: eventType,
          timestamp: new Date().toISOString(),
          location: userLocation,
          data: payload
      };
      
      // ?¤ì œ ?¹í›… ë°œì†¡
      fetch(WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify(dataToLog)
      }).catch(e => console.error(e));
  };
  window.sendTrackingData = sendTrackingData;


  // Search & Filter Logic
  const handleSearch = () => {
      const term = searchInput ? searchInput.value.toLowerCase() : "";
      
      // 2. ê²€?‰ì–´ ?°ì´???˜ì§‘ (ê¸€??2???´ìƒ ?…ë ¥ ???”í„°/?´ë¦­ ??
      if (term.length > 1) {
          sendTrackingData("search", { keyword: term });
      }

      // 3. ? íƒ??êµ?? ë°??œê·¸ ?„í„° ?•ì¸
      const selectedCountries = Array.from(document.querySelectorAll('.country-filter:checked')).map(cb => cb.value.toLowerCase());
      const selectedTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());

      const filtered = mockAgencies.filter(a => {
          // ?ìŠ¤??ê²€??(?´ë¦„, ?¬ë¡œê±? ì§€?? ?œê·¸)
          let matchesText = true;
          if (term) {
              const nameMatch = a.name && a.name.toLowerCase().includes(term);
              const taglineMatch = a.tagline && a.tagline.toLowerCase().includes(term);
              const regionMatch = a.region && a.region.toLowerCase().includes(term);
              const tagsMatch = a.tags && a.tags.some(t => t.toLowerCase().includes(term));
              matchesText = nameMatch || taglineMatch || regionMatch || tagsMatch;
          }

          // êµ?? ?„í„° (? íƒ??êµ??ê°€ ?ˆì„ ?Œë§Œ ì²´í¬)
          let matchesCountry = true;
          if (selectedCountries.length > 0) {
              // a.region??'korea' ê°™ì? ê°’ì´ ?¬í•¨?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸
              matchesCountry = selectedCountries.some(c => a.region && a.region.toLowerCase().includes(c));
          }

          // ?œê·¸ ?„í„° (Services, Solutions, Facilities)
          let matchesTags = true;
          if (selectedTags.length > 0) {
              // ? íƒ???œê·¸ ì¤??˜ë‚˜?¼ë„ agency.tags???¬í•¨?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸ (OR ì¡°ê±´)
              matchesTags = selectedTags.some(selectedTag => 
                  a.tags && a.tags.some(agencyTag => agencyTag.toLowerCase().includes(selectedTag))
              );
          }

          return matchesText && matchesCountry && matchesTags;
      });
      renderList(filtered);

      // 4. ?¸ì…˜ ?¤í† ë¦¬ì????„í„° ?íƒœ ?€??(?ˆë¡œê³ ì¹¨ ? ì???
      sessionStorage.setItem('rad_search_term', term);
      sessionStorage.setItem('rad_selected_countries', JSON.stringify(selectedCountries));
      sessionStorage.setItem('rad_selected_tags', JSON.stringify(selectedTags));

      // 5. ?„í„° ?´ì œ ë²„íŠ¼(Clear Button) ?íƒœ ?…ë°?´íŠ¸
      const clearBtn = document.getElementById("clear-filter-btn");
      if(clearBtn) {
          const hasFilters = term.length > 0 || selectedCountries.length > 0 || selectedTags.length > 0;
          if(hasFilters) {
              clearBtn.removeAttribute('disabled');
          } else {
              clearBtn.setAttribute('disabled', 'true');
          }
      }
  };
  
  // Attach Event Listeners to Country Checkboxes
  const countryCheckboxes = document.querySelectorAll('.country-filter');
  countryCheckboxes.forEach(cb => {
      cb.addEventListener('change', handleSearch);
  });
  
  // Attach Event Listeners to Tag Checkboxes
  const tagCheckboxes = document.querySelectorAll('.tag-filter');
  tagCheckboxes.forEach(cb => {
      cb.addEventListener('change', handleSearch);
  });
  
  // Attach Event Listener to Clear Filter Button
  const clearBtn = document.getElementById("clear-filter-btn");
  if(clearBtn) {
      clearBtn.addEventListener("click", () => {
          if(searchInput) searchInput.value = "";
          document.querySelectorAll('.filter-dropdown input[type="checkbox"]').forEach(cb => cb.checked = false);
          handleSearch();
      });
  }
  
  // Update Country Counts in the Dropdown UI dynamically
  const updateCountryCounts = () => {
      const countryMap = {};
      countryCheckboxes.forEach(cb => { countryMap[cb.value] = 0; });
      
      mockAgencies.forEach(a => {
          const r = a.region ? a.region.toLowerCase() : "";
          for (let c in countryMap) {
              if (r.includes(c)) countryMap[c]++;
          }
      });
      
      countryCheckboxes.forEach(cb => {
          const span = cb.parentElement.querySelector('span');
          if (span && countryMap[cb.value] !== undefined) {
              span.textContent = countryMap[cb.value];
          }
      });
  };
  updateCountryCounts();

  if(searchInput) {
      searchInput.addEventListener("keyup", (e) => {
          if (e.key === "Enter") handleSearch();
      });
      searchInput.addEventListener("input", handleSearch);
  }
  if(searchBtn) {
      searchBtn.addEventListener("click", handleSearch);
  }

  // Restore Filters on Load (if any)
  try {
      const savedTerm = sessionStorage.getItem('rad_search_term');
      const savedCountriesStr = sessionStorage.getItem('rad_selected_countries');
      const savedTagsStr = sessionStorage.getItem('rad_selected_tags');
      let needsSearch = false;

      if(savedTerm) {
          if(searchInput) searchInput.value = savedTerm;
          needsSearch = true;
      }
      
      if(savedCountriesStr) {
          const savedCountries = JSON.parse(savedCountriesStr);
          if (savedCountries.length > 0) {
              countryCheckboxes.forEach(cb => {
                  if (savedCountries.includes(cb.value.toLowerCase())) {
                      cb.checked = true;
                  }
              });
              needsSearch = true;
          }
      }

      if(savedTagsStr) {
          const savedTags = JSON.parse(savedTagsStr);
          if (savedTags.length > 0) {
              tagCheckboxes.forEach(cb => {
                  if (savedTags.includes(cb.value.toLowerCase())) {
                      cb.checked = true;
                  }
              });
              needsSearch = true;
          }
      }
      
      if(needsSearch) {
          handleSearch();
      }
  } catch(e) {
      console.error('Failed to restore filters', e);
  }

  // ============== MODAL LOGIC (Estimator) ==============
  const overlay = document.getElementById("modal-overlay");
  const openBtns = document.querySelectorAll(".open-estimate");
  const closeBtn = document.getElementById("close-modal");

  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const step3 = document.getElementById("step-3");
  
  const calcBtn = document.getElementById("calculate-btn");
  const sendBtn = document.getElementById("send-report-btn");
  const loadingDiv = document.getElementById("loading-status");

  if(overlay && openBtns) {
      openBtns.forEach(btn => {
          btn.addEventListener("click", (e) => {
              e.preventDefault();
              overlay.classList.add("active");
              // reset funnel
              step1.classList.add("active");
              step2.classList.remove("active");
              step3.classList.remove("active");
          });
      });

      closeBtn.addEventListener("click", () => {
          overlay.classList.remove("active");
      });

      overlay.addEventListener("click", (e) => {
          if(e.target === overlay) overlay.classList.remove("active");
      });

      calcBtn.addEventListener("click", () => {
          // Fake calculate animation
          const btnText = calcBtn.innerHTML;
          calcBtn.innerHTML = "Analyzing local costs...";
          calcBtn.style.opacity = "0.7";
          
          setTimeout(() => {
              step1.classList.remove("active");
              step2.classList.add("active");
              calcBtn.innerHTML = btnText;
              calcBtn.style.opacity = "1";
          }, 1500);
      });

      sendBtn.addEventListener("click", () => {
          const email = document.getElementById("user-email").value;
          if(!email || !email.includes('@')) {
              alert("Please enter a valid work email.");
              return;
          }

          // 3. ê²¬ì  ?°ì´??ë°?ë¦¬ë“œ(?´ë©”?? ?˜ì§‘
          const selectedCountries = Array.from(document.getElementById("t-country").selectedOptions).map(o => o.text);
          const method = document.getElementById("t-method").value;
          const difficulty = document.getElementById("t-diff").value;

          sendTrackingData("estimate_generated", {
              email: email,
              countries_selected: selectedCountries,
              research_method: method,
              target_difficulty: difficulty
          });

          sendBtn.innerHTML = "Sending...";
          
          setTimeout(() => {
              step2.classList.remove("active");
              step3.classList.add("active");
          }, 1000);
      });
  }

  // ============== MEGA MENU FILTER LOGIC ==============
  const filterTabs = document.querySelectorAll(".filter-tab");
  const filterDropdowns = document.querySelectorAll(".filter-dropdown");

  filterTabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
          e.stopPropagation(); 
          const targetId = tab.getAttribute("data-target");
          const targetDropdown = document.getElementById(targetId);

          const isActive = tab.classList.contains("active");
          filterTabs.forEach(t => t.classList.remove("active"));
          filterDropdowns.forEach(d => d.classList.remove("active"));

          if (!isActive && targetDropdown) {
              tab.classList.add("active");
              targetDropdown.classList.add("active");
          }
      });
  });

  document.addEventListener("click", (e) => {
      if (!e.target.closest('.filter-container')) {
          filterTabs.forEach(t => t.classList.remove("active"));
          filterDropdowns.forEach(d => d.classList.remove("active"));
      }
  });

  // Stop propagation clicking inside dropdowns so it doesn't close
  filterDropdowns.forEach(d => {
      d.addEventListener("click", (e) => e.stopPropagation());
  });

} // end of initApplication()
