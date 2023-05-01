import React, { useEffect, useContext } from 'react';
import {Layout, Model } from 'flexlayout-react';
import './App.css';
import 'flexlayout-react/style/light.css';
import { appLayout } from "./layout";
import { PetroContext } from './context/petroContext';
import TreeViewComponent from './scene/treeView/treeView';
import SceneComponent from "./scene/sceneComponent";
import { SceneData } from './AppData';

const model = Model.fromJson(appLayout);

const App = () => {

  const { dispatchAction } = useContext(PetroContext);

  useEffect(() => {
    dispatchAction({ type: "SET_SCENE_DATA", data: SceneData })
  }, []);

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
