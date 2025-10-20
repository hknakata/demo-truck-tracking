(function () {
  const state = {
    map: null,
    tilesLoaded: false,
    useMapId: false,
    markers: [],
    polylines: [],
    directionsService: null,
    directionsRenderers: [],
    animations: [],
    isAnimating: false,
    animTimer: null,
    trucks: [
      { 
        id: 'T-001', 
        color: '#8B5CF6',
        plateNumber: '粤B 12345挂',
        driverName: '张师傅',
        driverPhone: '138-2345-6789',
        status: '运行中',
        destination: '盐田港码头',
        avgSpeed: '45 km/h',
        distance: '23.5 km',
        volume: 78.5, // CBM
        currentPosition: { lng: 114.26075018290588, lat: 22.576257267483825 },
        path: [
          { lng: 114.25958433451825, lat: 22.571048425559137 },
          { lng: 114.27364344847045, lat: 22.576292691511732 }
        ]
      },
      { 
        id: 'T-002', 
        color: '#A0522D',
        plateNumber: '粤B A5678挂',
        driverName: '李师傅',
        driverPhone: '139-8765-4321',
        status: '停车中',
        destination: '南山科技园',
        avgSpeed: '0 km/h',
        distance: '45.8 km',
        volume: 78.3, // CBM
        currentPosition: { lng: 113.95077177905802, lat: 22.487783013429425 },
        path: [
          { lng: 114.26520260215443, lat: 22.577090368026855 },
          { lng: 113.95077177905802, lat: 22.487783013429425 }
        ]
      }
    ],
    jobs: [
      { id: 'J-001', truckId: 'T-001', status: '进行中', volume: 78.5 },
      { id: 'J-002', truckId: 'T-002', status: '进行中', volume: 78.3 },
      { id: 'J-003', truckId: 'T-001', status: '已完成', volume: 65.2 },
      { id: 'J-004', truckId: 'T-002', status: '已完成', volume: 45.8 },
      { id: 'J-005', truckId: 'T-001', status: '待分配', volume: 32.1 },
      { id: 'J-006', truckId: 'T-002', status: '待分配', volume: 28.9 },
      { id: 'J-007', truckId: 'T-001', status: '已完成', volume: 55.6 },
      { id: 'J-008', truckId: 'T-002', status: '进行中', volume: 41.2 }
    ],
    exceptions: [
      { id: 'E-001', truckId: 'T-001', type: '路线偏离', severity: '中等', time: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
      { id: 'E-002', truckId: 'T-002', type: '超时停车', severity: '低', time: new Date(Date.now() - 45 * 60 * 1000) }, // 45 minutes ago
      { id: 'E-003', truckId: 'T-001', type: '设备故障', severity: '高', time: new Date(Date.now() - 15 * 60 * 1000) } // 15 minutes ago
    ]
  };

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function updateDashboard() {
    // 更新车辆数量
    const truckCountEl = document.getElementById('truck-count');
    if (truckCountEl) {
      truckCountEl.textContent = state.trucks.length;
    }

    // 更新任务数量
    const jobCountEl = document.getElementById('job-count');
    if (jobCountEl) {
      jobCountEl.textContent = state.jobs.length;
    }

    // 更新总体积 (CBM)
    const volumeCbmEl = document.getElementById('volume-cbm');
    if (volumeCbmEl) {
      const totalVolume = state.jobs.reduce((sum, job) => sum + job.volume, 0);
      volumeCbmEl.textContent = totalVolume.toFixed(1);
    }

    // 更新异常数量
    const exceptionCountEl = document.getElementById('exception-count');
    if (exceptionCountEl) {
      exceptionCountEl.textContent = state.exceptions.length;
      // Make the exception card clickable
      const exceptionCard = exceptionCountEl.closest('.dashboard-card');
      if (exceptionCard && !exceptionCard.hasAttribute('data-clickable')) {
        exceptionCard.style.cursor = 'pointer';
        exceptionCard.setAttribute('data-clickable', 'true');
        exceptionCard.addEventListener('click', showExceptionsModal);
      }
    }
  }

  function addRandomException() {
    const truckIds = state.trucks.map(t => t.id);
    const exceptionTypes = ['路线偏离', '超时停车', '设备故障', '超速行驶', '急刹车'];
    const severities = ['低', '中等', '高'];
    
    // Create a realistic timestamp - sometimes very recent, sometimes a bit older
    const now = Date.now();
    const randomMinutesAgo = Math.floor(Math.random() * 30) + 1; // 1-30 minutes ago
    const exceptionTime = new Date(now - randomMinutesAgo * 60 * 1000);
    
    const newException = {
      id: 'E-' + String(Date.now()).slice(-6),
      truckId: truckIds[Math.floor(Math.random() * truckIds.length)],
      type: exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      time: exceptionTime
    };
    
    state.exceptions.push(newException);
    updateDashboard();
    
    // 限制异常数量，移除最旧的异常
    if (state.exceptions.length > 10) {
      state.exceptions.shift();
    }
  }

  function simulateDataUpdates() {
    // 每30秒随机添加一个异常 - DISABLED
    // setInterval(addRandomException, 30000);
    
    // 每5分钟更新一次任务状态
    setInterval(() => {
      const activeJobs = state.jobs.filter(job => job.status === '进行中');
      if (activeJobs.length > 0) {
        const randomJob = activeJobs[Math.floor(Math.random() * activeJobs.length)];
        randomJob.status = '已完成';
        updateDashboard();
      }
    }, 300000);
  }

  function addGridOverlay(map) {
    // Create a custom overlay for the grid
    const gridOverlay = new google.maps.OverlayView();
    
    gridOverlay.onAdd = function() {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.pointerEvents = 'none';
      div.style.zIndex = '1';
      this.div = div;
      
      const panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    };
    
    gridOverlay.draw = function() {
      const overlay = this;
      const projection = this.getProjection();
      const bounds = map.getBounds();
      
      if (!projection || !bounds) return;
      
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Calculate grid spacing based on zoom level
      const zoom = map.getZoom();
      let gridSpacing = 0.01; // Default spacing
      
      if (zoom >= 15) gridSpacing = 0.005;
      else if (zoom >= 13) gridSpacing = 0.01;
      else if (zoom >= 11) gridSpacing = 0.02;
      else if (zoom >= 9) gridSpacing = 0.05;
      else gridSpacing = 0.1;
      
      // Create grid lines
      let gridHTML = '<svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">';
      
      // Vertical lines
      for (let lng = Math.floor(sw.lng() / gridSpacing) * gridSpacing; lng <= ne.lng(); lng += gridSpacing) {
        const point1 = projection.fromLatLngToDivPixel(new google.maps.LatLng(sw.lat(), lng));
        const point2 = projection.fromLatLngToDivPixel(new google.maps.LatLng(ne.lat(), lng));
        
        if (point1 && point2) {
          gridHTML += `<line x1="${point1.x}" y1="${point1.y}" x2="${point2.x}" y2="${point2.y}" stroke="rgba(77, 163, 255, 0.3)" stroke-width="1" stroke-dasharray="2,2"/>`;
        }
      }
      
      // Horizontal lines
      for (let lat = Math.floor(sw.lat() / gridSpacing) * gridSpacing; lat <= ne.lat(); lat += gridSpacing) {
        const point1 = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, sw.lng()));
        const point2 = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, ne.lng()));
        
        if (point1 && point2) {
          gridHTML += `<line x1="${point1.x}" y1="${point1.y}" x2="${point2.x}" y2="${point2.y}" stroke="rgba(77, 163, 255, 0.3)" stroke-width="1" stroke-dasharray="2,2"/>`;
        }
      }
      
      gridHTML += '</svg>';
      overlay.div.innerHTML = gridHTML;
    };
    
    gridOverlay.onRemove = function() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
    };
    
    // Add the grid overlay to the map
    gridOverlay.setMap(map);
    
    // Redraw grid when map changes
    google.maps.event.addListener(map, 'bounds_changed', function() {
      gridOverlay.draw();
    });
    
    google.maps.event.addListener(map, 'zoom_changed', function() {
      gridOverlay.draw();
    });
  }

  function setAnimButtonLabel() {
    var btn = document.getElementById('anim-toggle');
    if (!btn) return;
    btn.textContent = state.isAnimating ? '暂停' : '播放';
  }

  function showVehicleModal(truckData) {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;

    const elements = {
      'modal-plate-number': truckData.plateNumber,
      'modal-vehicle-id': truckData.id,
      'modal-driver-name': truckData.driverName,
      'modal-driver-phone': truckData.driverPhone,
      'modal-vehicle-status': truckData.status,
      'modal-destination': truckData.destination,
      'modal-distance': truckData.distance,
      'modal-avg-speed': truckData.avgSpeed,
      'modal-last-update': new Date().toLocaleString('zh-CN')
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        if (id === 'modal-vehicle-status') {
          element.className = 'info-value status ' + value;
        }
      }
    });

    // 显示当前位置 - 优先使用currentPosition，然后是动画标记位置，最后是路径起点
    let currentLocation = '获取中...';
    if (truckData.currentPosition) {
      currentLocation = truckData.currentPosition.lat.toFixed(6) + ', ' + truckData.currentPosition.lng.toFixed(6);
    } else {
      const animIndex = state.trucks.findIndex(t => t.id === truckData.id);
      if (animIndex >= 0 && state.animations[animIndex] && state.animations[animIndex].marker) {
        const position = state.animations[animIndex].marker.getPosition();
        if (position) {
          currentLocation = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
        }
      } else if (truckData.path && truckData.path.length > 0) {
        const firstPos = truckData.path[0];
        currentLocation = firstPos.lat.toFixed(6) + ', ' + firstPos.lng.toFixed(6);
      }
    }
    
    const locationElement = document.getElementById('modal-current-location');
    if (locationElement) {
      locationElement.textContent = currentLocation;
    }

    modal.style.display = 'flex';
  }

  function hideVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function showExceptionsModal() {
    const modal = document.getElementById('exceptions-modal');
    const exceptionsList = document.getElementById('exceptions-list');
    
    if (!modal || !exceptionsList) return;

    // Clear existing content
    exceptionsList.innerHTML = '';

    // Sort exceptions by severity (high to low) and time (newest first)
    const sortedExceptions = [...state.exceptions].sort((a, b) => {
      const severityOrder = { '高': 3, '中等': 2, '低': 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.time) - new Date(a.time);
    });

    // Create exception items
    sortedExceptions.forEach(exception => {
      const truck = state.trucks.find(t => t.id === exception.truckId);
      const truckName = truck ? truck.plateNumber : `车辆 ${exception.truckId}`;
      
      const exceptionItem = document.createElement('div');
      exceptionItem.className = 'exception-item';
      
      // Get appropriate icon based on exception type
      let icon = '⚠️';
      if (exception.type.includes('路线')) icon = '🗺️';
      else if (exception.type.includes('停车')) icon = '🅿️';
      else if (exception.type.includes('设备')) icon = '🔧';
      else if (exception.type.includes('超速')) icon = '🚨';
      else if (exception.type.includes('刹车')) icon = '🛑';
      
      exceptionItem.innerHTML = `
        <div class="exception-icon">${icon}</div>
        <div class="exception-content">
          <div class="exception-header">
            <span class="exception-type">${exception.type}</span>
            <span class="exception-severity ${exception.severity}">${exception.severity}</span>
          </div>
          <div class="exception-details">
            <div class="exception-truck">车辆: ${truckName}</div>
            <div class="exception-time">时间: ${exception.time.toLocaleString('zh-CN')}</div>
            <div class="exception-id">ID: ${exception.id}</div>
          </div>
        </div>
      `;
      
      exceptionsList.appendChild(exceptionItem);
    });

    // Show modal
    modal.style.display = 'flex';
  }

  function hideExceptionsModal() {
    const modal = document.getElementById('exceptions-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function initModalEvents() {
    // Vehicle modal events
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideVehicleModal);
    }

    const modal = document.getElementById('vehicle-modal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          hideVehicleModal();
        }
      });
    }

    // Exceptions modal events
    const exceptionsCloseBtn = document.getElementById('exceptions-modal-close');
    if (exceptionsCloseBtn) {
      exceptionsCloseBtn.addEventListener('click', hideExceptionsModal);
    }

    const exceptionsModal = document.getElementById('exceptions-modal');
    if (exceptionsModal) {
      exceptionsModal.addEventListener('click', function(e) {
        if (e.target === exceptionsModal) {
          hideExceptionsModal();
        }
      });
    }

    // Global keyboard events
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideVehicleModal();
        hideExceptionsModal();
      }
    });
  }

  function initMapGoogle() {
    console.log('[debug] 开始初始化地图...');
    const center = { lat: 22.5550, lng: 114.1700 };
    const mapOptions = {
      center: center,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    };
    
    if (state.useMapId) {
      mapOptions.mapId = '6632bd93d15872fdc29db3c9';
    } else {
      mapOptions.styles = [
        { elementType: 'geometry', stylers: [{ color: '#0b1020' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1020' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#e7edf5' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#10223f' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2a4b' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1a33' }] },
        // Add grid lines
        { featureType: 'all', elementType: 'geometry.fill', stylers: [{ color: 'transparent' }] },
        { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'on' }] }
      ];
    }
    
    const mapElement = document.getElementById('map');
    console.log('[debug] 地图容器元素:', mapElement);
    console.log('[debug] 地图容器尺寸:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    let map = null;
    try {
      if (!google.maps.Map) {
        throw new Error('google.maps.Map is not available');
      }
      map = new google.maps.Map(mapElement, mapOptions);
    } catch (e) {
      console.warn('[warn] 创建 Map 失败，将移除 mapId 回退。错误：', e.message || e);
      if (mapOptions.mapId) delete mapOptions.mapId;
      state.useMapId = false;
      try {
        map = new google.maps.Map(mapElement, mapOptions);
      } catch (e2) {
        console.error('[error] 地图创建完全失败:', e2.message || e2);
        return;
      }
    }
    state.map = map;

    // Add grid overlay
    addGridOverlay(map);

    state.directionsService = new google.maps.DirectionsService();
    
    state.directionsRenderers = state.trucks.map(function(truck) {
      return new google.maps.DirectionsRenderer({
        map: state.map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: truck.color,
          strokeOpacity: 0.95,
          strokeWeight: 5
        }
      });
    });
    
    window.__map = map;
    console.log('[debug] 地图实例创建完成:', map);

    state.tilesLoaded = false;
    google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
      state.tilesLoaded = true;
      console.log('[maps] tilesloaded - 瓦片加载完成');
    });
    
    google.maps.event.addListener(map, 'idle', function() {
      console.log('[debug] 地图空闲状态，中心点:', map.getCenter().toString());
    });
  }

  function fitToAllRoutes() {
    if (!state.map || !state.directionsRenderers.length) return;
    const bounds = new google.maps.LatLngBounds();
    let hasRoute = false;
    state.directionsRenderers.forEach(function(renderer) {
      const directions = renderer.getDirections();
      if (directions && directions.routes && directions.routes[0]) {
        directions.routes[0].overview_path.forEach(function(pt) {
          bounds.extend(pt);
        });
        hasRoute = true;
      }
    });
    if (hasRoute) {
      state.map.fitBounds(bounds);
      console.log('[debug] 自动缩放到显示所有轨迹');
    }
  }

  function wireTruckFilter() {
    state.trucks.forEach(function(truck) {
      const checkbox = document.getElementById('truck-' + truck.id);
      if (!checkbox) return;
      checkbox.addEventListener('change', function(e) {
        const show = e.target.checked;
        const i = state.trucks.findIndex(function(t) { return t.id === truck.id; });
        if (i >= 0) {
          if (state.directionsRenderers[i]) state.directionsRenderers[i].setMap(show ? state.map : null);
          if (state.animations[i] && state.animations[i].marker) state.animations[i].marker.setMap(show ? state.map : null);
        }
        setTimeout(function() { fitToAllRoutes(); }, 100);
      });
    });
  }

  function wireAnimToggle() {
    const btn = document.getElementById('anim-toggle');
    if (!btn) return;
    setAnimButtonLabel();
    btn.addEventListener('click', function() {
      if (state.isAnimating) {
        pauseAnimations();
      } else {
        startAnimations();
      }
    });
  }

  function renderRouteWithDirections() {
    if (!state.map || !state.trucks.length) return;

    let completed = 0;
    const total = state.trucks.length;

    pauseAnimations();
    state.animations = [];

    state.trucks.forEach(function(truck, index) {
      const path = truck.path;
      if (path.length < 2) return;

      const origin = { lat: path[0].lat, lng: path[0].lng };
      const destination = { lat: path[path.length - 1].lat, lng: path[path.length - 1].lng };
      const waypoints = path.slice(1, path.length - 1).map(function(p) {
        return { location: { lat: p.lat, lng: p.lng }, stopover: false };
      });

      console.log('[debug] 请求 ' + truck.id + ' Directions，起点/终点/途经点数量:', 1, 1, waypoints.length);

      state.directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date() }
      }, function(result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          state.directionsRenderers[index].setDirections(result);
          console.log('[debug] ' + truck.id + ' Directions 渲染完成，路线段数:', result.routes[0].legs.length);

          const overview = result.routes[0].overview_path || [];
          if (overview.length > 1) {
            // 使用当前位置作为标记的初始位置
            const initialPosition = truck.currentPosition ? 
              { lat: truck.currentPosition.lat, lng: truck.currentPosition.lng } : 
              overview[0];
              
            const marker = new google.maps.Marker({
              map: state.map,
              position: initialPosition,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: truck.color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6
              },
              title: truck.plateNumber + ' (' + truck.id + ')',
              clickable: true
            });

            marker.addListener('click', function() {
              showVehicleModal(truck);
            });

            const anim = { marker: marker, path: overview, idx: 0, finished: false, truck: truck };
            state.animations[index] = anim;
          }
        } else {
          console.warn('[warn] ' + truck.id + ' Directions 请求失败:', status);
        }

        completed += 1;
        if (completed === total) {
          fitToAllRoutes();
          state.isAnimating = false;
          setAnimButtonLabel();
        }
      });
    });
  }

  function startAnimations() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    setAnimButtonLabel();
    if (state.animTimer) clearInterval(state.animTimer);
    state.animTimer = setInterval(function() {
      let allFinished = true;
      state.animations.forEach(function(anim) {
        if (!anim || !anim.marker || !anim.path || anim.finished) return;
        allFinished = false;
        const nextIdx = anim.idx + 1;
        if (nextIdx >= anim.path.length) {
          anim.finished = true;
          return;
        }
        anim.idx = nextIdx;
        anim.marker.setPosition(anim.path[anim.idx]);
      });
      if (allFinished) {
        pauseAnimations();
      }
    }, 200);
  }

  function pauseAnimations() {
    if (state.animTimer) clearInterval(state.animTimer);
    state.animTimer = null;
    state.isAnimating = false;
    setAnimButtonLabel();
  }

  function startWhenReady() {
    if (window.__mapInitialized) {
      console.log('[debug] 地图已经初始化，跳过重复初始化');
      return true;
    }
    
    if (window.google && window.google.maps && window.google.maps.Map) {
      console.log('[debug] Google Maps API 已加载');
      try {
        window.__mapInitialized = true;
        initMapGoogle();
        renderRouteWithDirections();

        setTimeout(function() {
          if (!state.tilesLoaded && state.useMapId) {
            console.warn('[maps] tiles not loaded in time, fallback to default base map');
            state.useMapId = false;
            initMapGoogle();
            renderRouteWithDirections();
          }
        }, 3500);
        return true;
      } catch (error) {
        console.error('[error] 地图初始化失败:', error);
        // Retry after a short delay
        setTimeout(function() {
          if (window.google && window.google.maps && window.google.maps.Map) {
            console.log('[debug] 重试地图初始化...');
            initMapGoogle();
            renderRouteWithDirections();
          }
        }, 1000);
        return false;
      }
    } else {
      console.log('[debug] Google Maps API 尚未完全加载，等待中...');
      return false;
    }
  }

  function bootstrap() {
    if (window.__appInitialized) {
      console.log('[debug] 应用已经初始化，跳过重复初始化');
      return;
    }
    window.__appInitialized = true;
    
    console.log('[debug] 开始启动应用...');
    initYear();
    initModalEvents();
    wireTruckFilter();
    wireAnimToggle();
    updateDashboard();
    simulateDataUpdates();
    
    if (!startWhenReady()) {
      console.log('[debug] 等待 Google Maps API 加载...');
      window.addEventListener('google-maps-ready', startWhenReady, { once: true });
      
      // Fallback: retry every 2 seconds if Google Maps API is not ready
      let retryCount = 0;
      const maxRetries = 10;
      const retryInterval = setInterval(function() {
        retryCount++;
        console.log('[debug] 重试检查 Google Maps API...', retryCount);
        
        if (window.google && window.google.maps && window.google.maps.Map) {
          console.log('[debug] Google Maps API 在重试中加载成功');
          clearInterval(retryInterval);
          startWhenReady();
        } else if (retryCount >= maxRetries) {
          console.error('[error] Google Maps API 加载超时，停止重试');
          clearInterval(retryInterval);
        }
      }, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
