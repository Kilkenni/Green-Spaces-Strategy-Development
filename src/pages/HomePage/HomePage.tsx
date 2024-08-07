import React, {useEffect, useState, useCallback} from 'react';
import GlMap, { Source, Layer, NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, AttributionControl, MapLayerMouseEvent, MapGeoJSONFeature, PopupEvent } from 'react-map-gl/maplibre';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//data imports
import areasDnipro from '../../assets/geo/All_Green_Areas_Dnipro_withAtributes.json';
import districtsDnipro from '../../assets/geo/Boroughs.json';
import { FeatureCollection } from 'geojson';
import MapLegend from "../../components/MapLegend";
import MapLegendItem from '../../components/MapLegendItem';
import AreaInfo from '../../components/AreaInfo';
import MapSourceSwitch from '../../components/MapSourceSwitch';
import MapAreaStats from '../../components/MapAreaStats';
import { AreaInfoAttr } from "../../components/MapAreaStats/MapAreaStats";

const contStyle = {
	display: "flex",
	width: "calc(100%)",
  height: "90%"
}

interface MapStyle {
  name: string,
  url: URL,
  customAttribution?: string,
};

//first style is the default one
const mapStyles: MapStyle[] = [
  {
    name: "OSM-UA Positron",
    url: new URL(`https://tile.openstreetmap.org.ua/styles/positron-gl-style/style.json`),
    customAttribution: `Фонова мапа: © <a href="https://openstreetmap.org.ua/#tile-server" target=_blank>🇺🇦 Українська спільнота OpenStreetMap</a>`,
  },
  {
    name: "CartoCDN Positron",
    url: new URL(`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`),
  },
  {
    name: "CartoCDN Dark Matter",
    url: new URL(`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`),
  },
];

function HomePage() {
  const CURSOR_TYPE = {
    AUTO: "auto",
    POINTER: "pointer",
  };

  type AreaInfo = {
    lat: number, 
    lng: number,
    data: MapGeoJSONFeature | null,
  };

  const showSourceError = (message:string):void => {
    toast.error(`${message}`, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: Bounce,
    });
  }

  const [availableStyles, setAvailableStyles] = useState<MapStyle[]>(mapStyles);
  const [style, setStyle] = useState(0);
  const [cursorType, setCursorType] = useState(CURSOR_TYPE.AUTO);
  const [styleJson, setStyleJson] = useState(null);
  const [interactiveLayerIds, setInteractiveLayerIds] = useState<string[]>(['nonexist']);
  const [showInteractiveLayers, toggleShowInteractiveLayers] = useState({
    Supervised: true,
    Unsupervised: true,
  });
  const [areaInfo, setAreaInfo] = useState<AreaInfo>({
    lat: 0,
    lng: 0,
    data: null,
  });

  //fetch default style for first render
  useEffect(() => {
      async function fetchStyle() {
        let response:Response|undefined = undefined;
        try {
          response = await fetch(availableStyles[style].url);
        }
        catch(error) {
          const typedError = error as TypeError;
          if(typedError.name === "TypeError" && typedError.message.includes("NetworkError")) {
            showSourceError(`Unable to load background style ${availableStyles[style].name}`);
          }
          else {
            console.log(error);
          }
        }
        finally {
          if(response === undefined) {
            if(style +1 < availableStyles.length) {
              setStyle(style+1); //switch to next map source
              return;
            }
            else {
              showSourceError("Cannot resolve background source");
              return;
            }
          }
          const jsonData = await response.json();
          setStyleJson(jsonData);
        }
        
      };

      fetchStyle();    
    }, [style, availableStyles]);

  useEffect(() => {
    const activeLayers: string[] = [];
    if (showInteractiveLayers.Supervised) {
      activeLayers.push('areas-supervised');
    }
    if (showInteractiveLayers.Unsupervised) {
      activeLayers.push('areas-unsupervised');
    }

    setInteractiveLayerIds(activeLayers);
  }, [showInteractiveLayers]
  );

  const onEnterPointable = useCallback(() => setCursorType(CURSOR_TYPE.POINTER), [CURSOR_TYPE.POINTER]);
  const onLeavePointable = useCallback(() => setCursorType(CURSOR_TYPE.AUTO), [CURSOR_TYPE.AUTO]);

  function onAreaClick(event: MapLayerMouseEvent):void {
    if (event.features && event.features.length > 0) {
      // if (areaInfo.data) { //If popup is open - close it
      //   setAreaInfo({
      //     lat: 0, lng: 0, data: null,
      //   });
      //   return;
      // }
      const feature: MapGeoJSONFeature = event.features[0];
      setAreaInfo({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
        data: feature,
      });
      // console.log("clicked interactive layer!")
      // console.log(feature);
    }
  }

  function onAreaPopupClose(event: PopupEvent) {
    setAreaInfo({
          lat: 0, lng: 0, data: null,
        });
  }

  const toggleLayer: React.ChangeEventHandler = (event) => {
    const layerName: "Supervised"|"Unsupervised" = event.currentTarget.id === "Supervised"? "Supervised" : "Unsupervised";
    const newLayers = showInteractiveLayers;
    newLayers[layerName] = !newLayers[layerName];
    toggleShowInteractiveLayers({ ...newLayers });
  }

	return <div style={contStyle}>
    {styleJson ? <GlMap
      initialViewState={{
        longitude: 35.0064,
        latitude: 48.4701,
        zoom: 10
      }}
      interactive={true}
      interactiveLayerIds={interactiveLayerIds}
      onMouseEnter={onEnterPointable}
      onMouseLeave={onLeavePointable}
      onClick={onAreaClick}
      cursor={cursorType}
      maxBounds={[
        [34.6064, 48.3301],
        [35.4064, 48.6001],
      ]}
      attributionControl={false}
      mapStyle={styleJson}>
      <Source
        type='geojson'
        data={districtsDnipro as FeatureCollection}>
        <Layer
          id='districts-outline'
          type='line'
          paint={{
            'line-color': '#05668D',
            'line-width': 2
          }}
        />
      </Source>
          
      <Source
        type='geojson'
        data={areasDnipro as FeatureCollection}>
        {showInteractiveLayers.Supervised && <Layer
          id='areas-supervised'
          key='areas-supervised'
          type='fill'
          paint={{
            'fill-color': '#3ABEFF',
            'fill-opacity': 0.5
          }}
          filter={['==', ['get', 'On budget'], true]}
        />}
        {showInteractiveLayers.Unsupervised && <Layer
          id='areas-unsupervised'
          key='areas-unsupervised'
          type='fill'
          paint={{
            'fill-color': '#D84797',
            'fill-opacity': 0.5
          }}
          filter={['==', ['get', 'On budget'], false]}
        />}
      </Source>
          
      <NavigationControl position='top-left' />
      <GeolocateControl
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation={true}
        position='top-left'
      />
      <FullscreenControl position='top-left' />
      <ScaleControl maxWidth={180} unit="metric" />
      <AttributionControl
        compact={false}
        customAttribution={availableStyles[style].customAttribution /*'Фонова мапа: © <a href="https://openstreetmap.org.ua/#tile-server" target=_blank>🇺🇦 Українська спільнота OpenStreetMap</a>'*/}
        position="bottom-right"
      />
      <MapLegend>
        <MapLegendItem
          active={showInteractiveLayers.Supervised}
          layerType="Supervised"
          label="Supervised"
          color='#3ABEFF'
          onToggleActive={toggleLayer}
        />
        <MapLegendItem
          active={showInteractiveLayers.Unsupervised}
          layerType="Unsupervised"
          label="Not supervised"
          color='#D84797'
          onToggleActive={toggleLayer}
        />
        <MapAreaStats areas={(areasDnipro as FeatureCollection).features as AreaInfoAttr[]} />
        <MapSourceSwitch sources={availableStyles} selectedSource={style} onSetSource={setStyle} />
      </MapLegend>
      {areaInfo.data &&
        <AreaInfo latitude={areaInfo.lat} longtitude={areaInfo.lng} onClose={onAreaPopupClose} data={areaInfo.data} />}
    </GlMap> : "Loading"}
    <ToastContainer />
	</div>
};

export {
  HomePage,
};
export type {
  MapStyle as MapStyleType,
}
