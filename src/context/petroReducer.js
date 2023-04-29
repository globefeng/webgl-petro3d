export const petroReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SCENE_DATA':
        return Object.assign( {}, state, { sceneData: action.data });    
    case 'SET_GEOLOCATION':
      return Object.assign( {}, state, { geoLocation: action.data });    
    case 'SET_TREEVIEW':
      return Object.assign( {}, state, { treeItems: action.data });
    case 'SET_TREEVIEW_VISIBLE':
        return Object.assign( {}, state, { visibleItems: action.data });    
    case 'SET_EVENTDATA':
      return Object.assign( {}, state, { eventData: action.data });
    case 'SET_FRACTUREDATA':
      return Object.assign( {}, state, { fractureData: action.data });
    case 'SET_EVENTTIME':
      return Object.assign( {}, state, { StartTime: action.data[0], EndTime: action.data[1] });
    case 'SET_SCENE_SIZE':
      return Object.assign( {}, state, { sceneSize: action.data });
    case 'SET_HISTOGRAM_SIZE':
      return Object.assign( {}, state, { histogramSize: action.data });           
    case 'SET_MAGNITUDE_DATA':
      return Object.assign( {}, state, { Magnitude: action.data });           
    case 'SET_CONFIDENCE_DATA':
      return Object.assign( {}, state, { Confidence: action.data });           
    case 'SET_OBJECTINFO_DATA':
      return Object.assign( {}, state, { objectInfo: action.data });           
    case 'SET_LOADING_DATA':
      return Object.assign( {}, state, { isLoading: action.data });           
    case 'SET_LOADING_ERROR':
      return Object.assign( {}, state, { loadingError: action.data });           
    case 'SET_ACTIVE_PROJECT':
        return Object.assign( {}, state, { activeProject: action.data });  
    case 'SET_WORKING_PROJECT':
        return Object.assign( {}, state, { workingProject: action.data });  
    case 'SET_MAPCENTER':
      return Object.assign({}, state, {mapCenter: action.data});                 
    case 'USER_LOGIN':
        return Object.assign({}, state, {CurrentUser: action.data});
    case 'SET_TOKEN_DATA':
        return Object.assign({}, state, {Token: action.data});
    case 'USER_LOGOUT':
      return Object.assign({}, state, {CurrentUser: null, Token: null, ProjectList: []});
    case 'SET_PROJECTS':
      return Object.assign({}, state, {ProjectList: action.data})
    default:
      return state;
  }
} 