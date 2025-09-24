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
        currentPosition: { lng: 113.95077177905802, lat: 22.487783013429425 },
        path: [
          { lng: 114.26520260215443, lat: 22.577090368026855 },
          { lng: 113.95077177905802, lat: 22.487783013429425 }
        ]
      }
    ]
  };

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
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

  function initModalEvents() {
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

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideVehicleModal();
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
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1a33' }] }
      ];
    }
    
    const mapElement = document.getElementById('map');
    console.log('[debug] 地图容器元素:', mapElement);
    console.log('[debug] 地图容器尺寸:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    let map = null;
    try {
      map = new google.maps.Map(mapElement, mapOptions);
    } catch (e) {
      console.warn('[warn] 创建 Map 失败，将移除 mapId 回退。错误：', e.message || e);
      if (mapOptions.mapId) delete mapOptions.mapId;
      state.useMapId = false;
      map = new google.maps.Map(mapElement, mapOptions);
    }
    state.map = map;

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
    if (window.google && window.google.maps) {
      console.log('[debug] Google Maps API 已加载');
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
    }
    return false;
  }

  function bootstrap() {
    console.log('[debug] 开始启动应用...');
    initYear();
    initModalEvents();
    wireTruckFilter();
    wireAnimToggle();
    if (!startWhenReady()) {
      console.log('[debug] 等待 Google Maps API 加载...');
      window.addEventListener('google-maps-ready', startWhenReady, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
