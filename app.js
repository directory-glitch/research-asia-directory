// gabia_deploy/app.js

// ================= DATA FETCHING (Google Sheets Integration) =================
// 3계층 아키텍처: 파이썬이 긁어온 데이터를 구글 시트에 올린 후, [파일 > 공유 > 웹에 게시(CSV)] 한 주소를 여기에 넣으세요.
const REAL_DATA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";

let mockAgencies = []; // API/시트에서 불러와 채워질 전역 배열

async function fetchRealDataFromGoogleSheet() {
    try {
        // [1] 추후 구글 시트 주소가 세팅되면 이 주석을 풀고 사용하세요.
        // const response = await fetch(REAL_DATA_CSV_URL);
        // const csvText = await response.text();
        // mockAgencies = csvParseLogic(csvText); // CSV를 JS 객체로 파싱하는 커스텀 로직

        // [2] 파이썬 스크립트(execution/clean_esomar_data.py)가 생성한 실 데이터 파일이 
        // index.html 헤더에 로드되었다면 그 데이터를 우선적으로 사용합니다!
        if (typeof REAL_AGENCIES !== "undefined") {
            mockAgencies = REAL_AGENCIES;
            console.log(`[Log] Successfully loaded ${mockAgencies.length} real agencies from Python Bot.`);
        } 
        // [3] 아무 연동도 안 되어있을 경우 돌아가는 예비(Mock) 하드코딩 데이터
        else {
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
        
        // 데이터 로딩 성공 시 화면 화면 렌더링 시작
        initApplication();
    } catch(err) {
        console.error("Failed to load real data:", err);
    }
}

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    fetchRealDataFromGoogleSheet(); // 앱 시작 시 최초 데이터 로딩
});

function initApplication() {
  // 원래 있던 DOM 변수 선언 부분
  const container = document.getElementById("agency-list");
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
  // 정적 호스팅(가비아)에서는 DB가 없으므로 Make(Integromat), Zapier 또는 구글 앱스 스크립트 웹훅 URL로 데이터를 쏩니다.
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxrcf1Cz3jhQ7rvLUZX0aM32DGzL6u1dxKxHS8gvink0Xzww0JmA4SVjgqdyvee_UyM2g/exec";

  let userLocation = null;

  // 1. 접속 시 GPS(IP 기반 주소) 수집
  fetch("https://ipapi.co/json/")
    .then(res => res.json())
    .then(data => {
        userLocation = {
            ip: data.ip,
            city: data.city,
            country: data.country_name,
            org: data.org // 기업 접속망 확인용 (B2B 의도 데이터 파악 핵심)
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

  // 트래킹 전송 공통 함수 (전역 노출)
  const sendTrackingData = (eventType, payload) => {
      const dataToLog = {
          event: eventType,
          timestamp: new Date().toISOString(),
          location: userLocation,
          data: payload
      };
      
      // 실제 웹훅 발송
      fetch(WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify(dataToLog)
      }).catch(e => console.error(e));
  };
  window.sendTrackingData = sendTrackingData;


  // Search & Filter Logic
  const handleSearch = () => {
      const term = searchInput ? searchInput.value.toLowerCase() : "";
      
      // 2. 검색어 데이터 수집 (글자 2자 이상 입력 후 엔터/클릭 시)
      if (term.length > 1) {
          sendTrackingData("search", { keyword: term });
      }

      // 3. 선택된 국가 및 태그 필터 확인
      const selectedCountries = Array.from(document.querySelectorAll('.country-filter:checked')).map(cb => cb.value.toLowerCase());
      const selectedTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());

      const filtered = mockAgencies.filter(a => {
          // 텍스트 검색 (이름, 슬로건, 지역, 태그)
          let matchesText = true;
          if (term) {
              const nameMatch = a.name && a.name.toLowerCase().includes(term);
              const taglineMatch = a.tagline && a.tagline.toLowerCase().includes(term);
              const regionMatch = a.region && a.region.toLowerCase().includes(term);
              const tagsMatch = a.tags && a.tags.some(t => t.toLowerCase().includes(term));
              matchesText = nameMatch || taglineMatch || regionMatch || tagsMatch;
          }

          // 국가 필터 (선택된 국가가 있을 때만 체크)
          let matchesCountry = true;
          if (selectedCountries.length > 0) {
              // a.region에 'korea' 같은 값이 포함되어 있는지 확인
              matchesCountry = selectedCountries.some(c => a.region && a.region.toLowerCase().includes(c));
          }

          // 태그 필터 (Services, Solutions, Facilities)
          let matchesTags = true;
          if (selectedTags.length > 0) {
              // 선택된 태그 중 하나라도 agency.tags에 포함되어 있는지 확인 (OR 조건)
              matchesTags = selectedTags.some(selectedTag => 
                  a.tags && a.tags.some(agencyTag => agencyTag.toLowerCase().includes(selectedTag))
              );
          }

          return matchesText && matchesCountry && matchesTags;
      });
      renderList(filtered);

      // 4. 세션 스토리지에 필터 상태 저장 (새로고침 유지용)
      sessionStorage.setItem('rad_search_term', term);
      sessionStorage.setItem('rad_selected_countries', JSON.stringify(selectedCountries));
      sessionStorage.setItem('rad_selected_tags', JSON.stringify(selectedTags));

      // 5. 필터 해제 버튼(Clear Button) 상태 업데이트
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

          // 3. 견적 데이터 및 리드(이메일) 수집
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
