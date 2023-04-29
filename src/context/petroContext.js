import React, { createContext, useReducer } from 'react';
import { petroReducer } from './petroReducer';

export const PetroContext = createContext();

const PetroContextProvider = (props) => {
  const [sceneData, dispatchAction] = useReducer(petroReducer, [], () => {
     return { sceneSize: [800, 600], 
              histogramSize: null, 
              sceneData: null, 
              treeItems: null, 
              visibleItems: [], 
              eventData: null, 
              pp_fractureData_EE: null,
              StartTime: 0, 
              EndTime: 0,
              Magnitude: [-5, 0], 
              Confidence: [-5, 5],
              geoLocation: null,
              mapCenter: {lng:-95.3698, lat: 29.7604},
              activeProject: -1,
              workingProject: -1,
              objectInfo: [],
              isLoading: false,
              loadingError: false,
              ProjectList: [],
              CurrentUser: null,
              Token: null
      };
  });

  return (
    <PetroContext.Provider value={{ ...sceneData, dispatchAction }}>
      {props.children}
    </PetroContext.Provider>
  );
}

export default PetroContextProvider;