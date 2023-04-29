import React, { useEffect, useContext } from 'react';
import {Layout, Model } from 'flexlayout-react';
import './App.css';
import 'flexlayout-react/style/light.css';
import { appLayout } from "./layout";
// import axios from 'axios';
import { PetroContext } from './context/petroContext';
import TreeViewComponent from './scene/treeView/treeView';
import SceneComponent from "./scene/sceneComponent";
import { SceneData } from './AppData';

const model = Model.fromJson(appLayout);

const App = () => {

  const { sceneSize, dispatchAction } = useContext(PetroContext);

  useEffect(() => {
    // axios({
    //   method: 'get',
    //   url: `api/Projects/demo`,
    //   headers: {'responseType': 'arraybuffer'}
    //   }).then(res => {
    //     // console.log(res.data)
    //     dispatchAction({ type: "SET_SCENE_DATA", data: res.data })
    // });
    dispatchAction({ type: "SET_SCENE_DATA", data: SceneData })

    const interval = setInterval(() => updateSize(), 500);    
    return () => clearInterval(interval);
  }, []);

  const updateSize = () => {
    let sceneContainer = document.getElementById('sceneContainer');
    if (sceneContainer) {
      let sceneRect = sceneContainer.getBoundingClientRect();
      if (sceneSize[0] !== sceneRect.width || sceneSize[1] !== sceneRect.height) {
        dispatchAction({ type: "SET_SCENE_SIZE", data: [sceneRect.width, sceneRect.height] })
      }
    }

    // let histogramContainer = document.getElementById('histogramContainer');
    // if (histogramContainer) {
    //   let histogramRect = histogramContainer.getBoundingClientRect();
    //   dispatchAction({ type: "SET_HISTOGRAM_SIZE", data: [histogramRect.width, histogramRect.height] })
    // }
  }

  const factory = (node) => {
    var component = node.getComponent();
    if (component === "Project") {
        return (
          <div style={{ background: "white", padding: '6px' }} className="panelProject">
            <TreeViewComponent />
          </div>
        );
    } else if (component === "scene") {
        return (
          <SceneComponent />
        );
    }
  }

  return (
    <div style={{position: 'relative', height: '100vh'}}>
      <Layout model={model} factory={factory} />
    </div>
  );
}

export default App;
