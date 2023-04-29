import React, { useEffect, useContext }  from "react";
import { PetroContext } from '../../context/petroContext';

const MapComponent = () => {
  const { geoLocation } = useContext(PetroContext)

  useEffect(() => {
    const location = { lat: geoLocation.Y, lng: geoLocation.X };
    const map = new window.google.maps.Map(
      document.getElementById("myMap"),
      {
        center: location,
        zoom: 12,
        mapTypeId: "roadmap" /* terrain, satellite */,
      }
    );
  }, [geoLocation])

  return (<div style={{ width: "100%", height: "100%" }} id="myMap" />);
}


export default MapComponent;