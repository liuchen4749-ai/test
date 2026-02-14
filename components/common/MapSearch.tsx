import React, { useState } from 'react';
import L from 'leaflet';

const MapSearch = ({ map }: { map: L.Map | null }) => {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    
    const handleSearch = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if(!query.trim() || !map) return;
        
        setSearching(true);

        // 1. Try to parse as Coordinate (Lat, Lng)
        // Matches "30.5, 104" or "30.5,104"
        const coordRegex = /^(\d+(\.\d+)?)\s*,\s*(\d+(\.\d+)?)$/;
        const match = query.match(coordRegex);
        
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[3]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                map.setView([lat, lng], 15);
                L.popup()
                    .setLatLng([lat, lng])
                    .setContent(`📍 坐标定位: ${lat}, ${lng}`)
                    .openOn(map);
                setSearching(false);
                return;
            }
        }

        // 2. Fallback to API Search
        try {
            // Using OSM Nominatim. Note: In China this might be slow or blocked without VPN.
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
                headers: {
                    'Accept-Language': 'zh-CN,zh;q=0.9'
                }
            });
            const data = await response.json();
            
            if(data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const targetLat = parseFloat(lat);
                const targetLng = parseFloat(lon);
                
                map.setView([targetLat, targetLng], 13);
                L.popup()
                    .setLatLng([targetLat, targetLng])
                    .setContent(`🔍 搜索结果: ${display_name}`)
                    .openOn(map);
            } else {
                alert("未找到该地点，请尝试输入更详细的地址或城市名。");
            }
        } catch(err) {
            const confirmInput = confirm("搜索服务连接失败 (可能受网络环境影响)。\n\n您可以尝试：\n1. 输入 '纬度,经度' (如 30.67, 104.06) 直接定位。\n2. 点击确定，跳转到外部地图查询坐标。");
            if (confirmInput) {
                window.open(`https://www.amap.com/search?query=${encodeURIComponent(query)}`, '_blank');
            }
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="absolute top-2 right-2 z-[1000] bg-white p-1 rounded shadow-md flex">
            <form onSubmit={handleSearch} className="flex">
                <input 
                    type="text" 
                    className="p-1 px-2 text-sm outline-none w-48" 
                    placeholder={searching ? "搜索中..." : "搜地名 或 纬度,经度"} 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    disabled={searching}
                />
                <button type="submit" disabled={searching} className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ${searching ? 'opacity-50' : ''}`}>
                    {searching ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                </button>
            </form>
        </div>
    );
};

export default MapSearch;