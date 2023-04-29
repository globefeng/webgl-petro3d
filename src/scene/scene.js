import { initShaderProgram } from './shader/shader';
import { SceneInfo } from './sceneInfo';
import { LocalTangentPlane } from './localTangentPlane';
import { BoundingBox } from './petroObject/boundingBox';
import { Camera3D } from './camera/camera3D';
import { CompassPanel } from './camera/compassPanel';
import { NavigationPanel } from './camera/navigationPanel';

import { Wellbore } from './petroObject/wellbore';
import { RenderableGroup } from './petroObject/renderableGroup';
import { Geophone } from './petroObject/geoPhone';
import { Perf } from './petroObject/perf';
import { LasLog } from './petroObject/laslog';
import { Formation } from './petroObject/formation';
import { Plane } from './petroObject/plane';
import { SE_StageEvents, EventItem } from './petroObject/microEventStage';
import { ConvertRGBToID, PickingResult, ConvertColorToFloat } from './sceneConsts';
import { SceneData } from '../AppData';

import TreeViewItem from './treeView/treeViewItem';

export function Scene() {
    this.currentWidth = 1;
    this.currentHeight = 1;
    this.sceneFramebuffer = null; 
    this.sceneRenderBuffer = null;
    this.treeViewItems = [];

    this.init = function(gl, sceneData) {
        console.log(sceneData);
        console.log('====================')
        console.log(SceneData);

        this.gl = gl;
        let shaderProgram = initShaderProgram(this.gl);

        this.localTangentPlane = new LocalTangentPlane();
        this.localTangentPlane.init(0, 0, 0);
    
        this.sceneInfo = new SceneInfo();
        this.sceneInfo.init(this.gl, shaderProgram, this.localTangentPlane);

        this.geoLocation = sceneData.DD_LTPOrig_EE;

        this.boundingBox = new BoundingBox(this.sceneInfo);
        this.boundingBox.init(sceneData.DD_BoundMinMeter_EE.X, sceneData.DD_BoundMinMeter_EE.Y, sceneData.DD_BoundMinMeter_EE.Z,
            sceneData.DD_BoundMaxMeter_EE.X, sceneData.DD_BoundMaxMeter_EE.Y, sceneData.DD_BoundMaxMeter_EE.Z,
            sceneData.DD_GridSizeMeter_EE);

        this.boundingBoxFoot = new BoundingBox(this.sceneInfo);    
        this.boundingBoxFoot.init(sceneData.DD_BoundMinFoot_EE.X / 3.2808399, 
                                              sceneData.DD_BoundMinFoot_EE.Y / 3.2808399, 
                                              sceneData.DD_BoundMinFoot_EE.Z / 3.2808399,
                                              sceneData.DD_BoundMaxFoot_EE.X / 3.2808399, 
                                              sceneData.DD_BoundMaxFoot_EE.Y / 3.2808399, 
                                              sceneData.DD_BoundMaxFoot_EE.Z / 3.2808399,
                                              sceneData.DD_GridSizeFoot_EE / 3.2808399);

        var centerPosition = [(this.boundingBox.minX + this.boundingBox.maxX) / 2,
                                this.boundingBox.minY,
                                (this.boundingBox.minZ + this.boundingBox.maxZ) / 2];

        var offset = [(this.boundingBox.maxX - this.boundingBox.minX) * 1.0, (this.boundingBox.maxY - this.boundingBox.minY) * 1.4, (this.boundingBox.maxZ - this.boundingBox.minZ) * 1.0];

        var camPosition = [centerPosition[0] + offset[0], centerPosition[1] + offset[1], centerPosition[2] + offset[2]];

        let maxDistance = 5 * Math.sqrt((this.boundingBox.maxX - this.boundingBox.minX) * (this.boundingBox.maxX - this.boundingBox.minX) +
                                    (this.boundingBox.maxY - this.boundingBox.minY) * (this.boundingBox.maxY - this.boundingBox.minY) +
                                    (this.boundingBox.maxZ - this.boundingBox.minZ) * (this.boundingBox.maxZ - this.boundingBox.minZ));

        this.camera3D = new Camera3D(this.sceneInfo);
        this.camera3D.init(camPosition, centerPosition, maxDistance);

        this.sceneInfo.sceneCamera = this.camera3D;

        this.interfaceGroup = new RenderableGroup("Interface", 0, this.sceneInfo);
        let compassPanel = new CompassPanel(this.sceneInfo);
        compassPanel.init();
        this.interfaceGroup.addChild(compassPanel);

        let navigationPanel = new NavigationPanel(this.sceneInfo);
        navigationPanel.init();
        this.interfaceGroup.addChild(navigationPanel);

        this.projectGroup = new RenderableGroup("Project", 0, this.sceneInfo);
 
        let rootItem = new TreeViewItem();
        rootItem.id = 0;
        rootItem.name = 'Project';
        rootItem.treeType = 0;
        rootItem.depth = 0;        
        rootItem.hasChildren = true;
        this.treeViewItems.push(rootItem);

        if (sceneData.DD_WellGroup_EE !== undefined && sceneData.DD_WellGroup_EE !== null && 
            sceneData.DD_WellGroup_EE.DD_Wellbores_EE !== undefined && sceneData.DD_WellGroup_EE.DD_Wellbores_EE !== null) 
        {
            let wellGroup = new RenderableGroup(sceneData.DD_WellGroup_EE.DD_Name_EE, sceneData.DD_WellGroup_EE.DD_ID_EE, this.sceneInfo);
            this.projectGroup.addChild(wellGroup);

            let wellGroupNode = new TreeViewItem();
            wellGroupNode.id = sceneData.DD_WellGroup_EE.DD_ID_EE;
            wellGroupNode.name = sceneData.DD_WellGroup_EE.DD_Name_EE;
            wellGroupNode.treeType = 1;
            wellGroupNode.depth = 1;        
            wellGroupNode.hasChildren = true;
            this.treeViewItems.push(wellGroupNode);
    
            for (var i = 0; i < sceneData.DD_WellGroup_EE.DD_Wellbores_EE.length; i++) {
                let wellbore = new Wellbore(this.sceneInfo);
                let wellboreData = sceneData.DD_WellGroup_EE.DD_Wellbores_EE[i];

                let wellboreNode = new TreeViewItem();
                wellboreNode.id = wellboreData.DD_ID_EE;
                wellboreNode.name = wellboreData.DD_Name_EE;
                wellboreNode.treeType = 2;    
                wellboreNode.depth = 2;        
                wellboreNode.hasChildren = true;
                this.treeViewItems.push(wellboreNode);

                let wellData = [];
                for (var j = 0; j < wellboreData.DD_JointPoints_EE.length; j++) {
                    var p = wellboreData.DD_JointPoints_EE[j];
                    wellData.push([p.X, p.Y, p.Z]);
                }
        
                wellbore.init(wellboreData.DD_Name_EE, wellboreData.DD_ID_EE, 10, wellData, 
                    [wellboreData.DD_Color_EE.X, wellboreData.DD_Color_EE.Y, wellboreData.DD_Color_EE.Z]);

                if (wellboreData.DD_GeophoneGroup_EE !== null && wellboreData.DD_GeophoneGroup_EE.DD_GeophoneCollection_EE !== undefined) {
                    let geophoneGroup = new RenderableGroup(wellboreData.DD_GeophoneGroup_EE.DD_Name_EE, wellboreData.DD_GeophoneGroup_EE.DD_ID_EE, this.sceneInfo);
                    wellbore.addChild(geophoneGroup);

                    let geophoneNode = new TreeViewItem();
                    geophoneNode.id = wellboreData.DD_GeophoneGroup_EE.DD_ID_EE;
                    geophoneNode.name = wellboreData.DD_GeophoneGroup_EE.DD_Name_EE;
                    geophoneNode.treeType = 6;    
                    geophoneNode.depth = 3;        
                    geophoneNode.hasChildren = false;
                    this.treeViewItems.push(geophoneNode);

                    let geophoneCollection = wellboreData.DD_GeophoneGroup_EE.DD_GeophoneCollection_EE;
                    for (var k = 0; k < geophoneCollection.length; k++) {
                        var geophoneObject = geophoneCollection[k];

                        var geophoneRenderable = new Geophone(this.sceneInfo);
                        geophoneRenderable.init(wellbore, geophoneObject.DD_Name_EE);                       

                        var geophoneData = [];
                        for (var m = 0; m < geophoneObject.DD_Distances_EE.length; m++) {
                            geophoneData.push(geophoneObject.DD_Distances_EE[m]);
                        }

                        geophoneRenderable.setData(geophoneData);
                        geophoneGroup.addChild(geophoneRenderable);
                    }
                }

                if (wellboreData.DD_PerfGroup_EE !== null && wellboreData.DD_PerfGroup_EE.DD_PerfCollection_EE !== undefined ) {
                    let perfGroup = new RenderableGroup(wellboreData.DD_PerfGroup_EE.DD_Name_EE, wellboreData.DD_PerfGroup_EE.DD_ID_EE, this.sceneInfo);
                    wellbore.addChild(perfGroup);

                    let perfNode = new TreeViewItem();
                    perfNode.id = wellboreData.DD_PerfGroup_EE.DD_ID_EE;
                    perfNode.name = wellboreData.DD_PerfGroup_EE.DD_Name_EE;
                    perfNode.treeType = 7;    
                    perfNode.depth = 3;        
                    perfNode.hasChildren = false;
                    this.treeViewItems.push(perfNode);  

                    for (var ii = 0; ii < wellboreData.DD_PerfGroup_EE.DD_PerfCollection_EE.length; ii++) {
                        var perfObject = wellboreData.DD_PerfGroup_EE.DD_PerfCollection_EE[ii];

                        var perfRenderable = new Perf(this.sceneInfo);
                        perfRenderable.init(wellbore, perfObject.DD_Name_EE, perfObject.DD_Color_EE);

                        var perfData = [];
                        for (var jj = 0; jj < perfObject.DD_Distances_EE.length; jj++) {
                            perfData.push(perfObject.DD_Distances_EE[jj]);
                        }
                        perfRenderable.setData(perfData);
                        perfGroup.addChild(perfRenderable);
                    }
                }            

                if (wellboreData.DD_LasLog_EE != null) {
                    var lasRenderable = new LasLog(this.sceneInfo);
                    lasRenderable.init(wellbore, wellboreData.DD_LasLog_EE);
                    
                    let lasName = lasRenderable.changeChannel('GR');

                    let lasNode = new TreeViewItem();
                    lasNode.id = wellboreData.DD_LasLog_EE.DD_ID_EE;
                    lasNode.name = lasName;
                    lasNode.treeType = 8;    
                    lasNode.depth = 3;        
                    lasNode.hasChildren = false;
                    lasNode.data = wellboreData.DD_LasLog_EE.DD_NameList_EE;
                    lasNode.renderable = lasRenderable;
                    this.treeViewItems.push(lasNode);  

                    wellbore.addChild(lasRenderable);
                }

                wellGroup.addChild(wellbore);    
            }
        }

        if (sceneData.DD_FormationGroup_EE !== null && sceneData.DD_FormationGroup_EE.DD_FormationCollection_EE !== null) {
            let formationGroup = new RenderableGroup(sceneData.DD_FormationGroup_EE.DD_Name_EE, sceneData.DD_FormationGroup_EE.DD_ID_EE, this.sceneInfo);
            this.projectGroup.addChild(formationGroup);

            let formationGroupNode = new TreeViewItem();
            formationGroupNode.id = sceneData.DD_FormationGroup_EE.DD_ID_EE;
            formationGroupNode.name = sceneData.DD_FormationGroup_EE.DD_Name_EE;
            formationGroupNode.treeType = 11;    
            formationGroupNode.depth = 1;        
            formationGroupNode.hasChildren = true;
            this.treeViewItems.push(formationGroupNode);

            for (var i2 = 0; i2 < sceneData.DD_FormationGroup_EE.DD_FormationCollection_EE.length; i2++) {
                let formationObject = sceneData.DD_FormationGroup_EE.DD_FormationCollection_EE[i2];

                let formationVertexList = []
                for (var k1 = 0; k1 < formationObject.DD_VertexList_EE.length; k1++) {
                    let pItem = formationObject.DD_VertexList_EE[k1];
                    formationVertexList.push(pItem.X);
                    formationVertexList.push(pItem.Y);
                    formationVertexList.push(pItem.Z);
                }

                let formationIndexList = []
                for (var k2 = 0; k2 < formationObject.DD_TriangleList_EE.length; k2++) {
                    var iItem = formationObject.DD_TriangleList_EE[k2];
                    formationIndexList.push(iItem.X);
                    formationIndexList.push(iItem.Y);
                    formationIndexList.push(iItem.Z);
                }

                var formationRenderable = new Formation(this.sceneInfo);

                formationRenderable.init(formationObject.DD_Name_EE, formationObject.DD_ID_EE, formationVertexList, formationIndexList);

                let formationMinColor = [formationObject.DD_MinColor_EE.X, formationObject.DD_MinColor_EE.Y, formationObject.DD_MinColor_EE.Z];
                let formationMaxColor = [formationObject.DD_MaxColor_EE.X, formationObject.DD_MaxColor_EE.Y, formationObject.DD_MaxColor_EE.Z];

                formationRenderable.setColor(formationObject.DD_MinY_EE, formationObject.DD_MaxY_EE, formationMinColor, formationMaxColor);

                formationGroup.addChild(formationRenderable);

                let formation = new TreeViewItem();
                formation.id = formationObject.DD_ID_EE;
                formation.name = formationObject.DD_Name_EE;
                formation.treeType = 12;    
                formation.depth = 2;        
                formation.hasChildren = false;
                this.treeViewItems.push(formation);
            }
        }

        if (sceneData.DD_EventGroup_EE !== null && sceneData.DD_EventGroup_EE.DD_EventWellCollection_EE !== null) {
            let eventGroup = new RenderableGroup(sceneData.DD_EventGroup_EE.DD_Name_EE, sceneData.DD_EventGroup_EE.DD_ID_EE, this.sceneInfo);            
            this.projectGroup.addChild(eventGroup);

            let eventGroupNode = new TreeViewItem();
            eventGroupNode.id = sceneData.DD_EventGroup_EE.DD_ID_EE;
            eventGroupNode.name = sceneData.DD_EventGroup_EE.DD_Name_EE;
            eventGroupNode.treeType = 3;    
            eventGroupNode.depth = 1;        
            eventGroupNode.hasChildren = true;
            this.treeViewItems.push(eventGroupNode);               

            for (var i3 = 0; i3 < sceneData.DD_EventGroup_EE.DD_EventWellCollection_EE.length; i3++) {
                let eventWellObject = sceneData.DD_EventGroup_EE.DD_EventWellCollection_EE[i3];

                var renderableWellEventGroup = new RenderableGroup(eventWellObject.DD_Name_EE, eventWellObject.DD_ID_EE, this.sceneInfo);
                eventGroup.addChild(renderableWellEventGroup);

                let eventWellNode = new TreeViewItem();
                eventWellNode.id = eventWellObject.DD_ID_EE;
                eventWellNode.name = eventWellObject.DD_Name_EE;
                eventWellNode.treeType = 4;    
                eventWellNode.depth = 2;        
                eventWellNode.hasChildren = true;
                this.treeViewItems.push(eventWellNode);                 

                for (var k3 = 0; k3 < eventWellObject.DD_StageCollection_EE.length; k3++) {
                    var stageObject = eventWellObject.DD_StageCollection_EE[k3];

                    let eventList = []
                    for (var kk3 = 0; kk3 < stageObject.DD_EventCollection_EE.length; kk3++) {
                        var eItem = stageObject.DD_EventCollection_EE[kk3];
                        eventList.push(new EventItem([eItem.X, eItem.Y, eItem.Z], eItem.M, eItem.C, eItem.T));
                    }

                    var stageEvents = new SE_StageEvents(this.sceneInfo);
                    stageEvents.init(stageObject.DD_Name_EE, stageObject.DD_ID_EE, [stageObject.DD_Color_EE.X, stageObject.DD_Color_EE.Y, stageObject.DD_Color_EE.Z]);
                    stageEvents.setupEventBuffer(eventList);
                    renderableWellEventGroup.addChild(stageEvents);

                    let eventStageNode = new TreeViewItem();
                    eventStageNode.id = stageObject.DD_ID_EE;
                    eventStageNode.name = stageObject.DD_Name_EE;
                    eventStageNode.treeType = 5;    
                    eventStageNode.depth = 3;        
                    eventStageNode.hasChildren = false;
                    this.treeViewItems.push(eventStageNode);                       
                }               
            }
        }
    }

    this.initSceneTexture = function(width, height) {
        if (this.sceneTexture !== null) {
            this.gl.deleteTexture(this.sceneTexture);
        }
        if (this.sceneRenderBuffer !== null) {
            this.gl.deleteRenderbuffer(this.sceneRenderBuffer);
        }
        if (this.sceneFramebuffer !== null) {
            this.gl.deleteFramebuffer(this.sceneFramebuffer);
        }
        
        this.sceneFramebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sceneFramebuffer);
        this.sceneFramebuffer.width = width;
        this.sceneFramebuffer.height = height;

        this.sceneTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.sceneFramebuffer.width, this.sceneFramebuffer.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        this.sceneRenderBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.sceneRenderBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.sceneFramebuffer.width, this.sceneFramebuffer.height);

        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.sceneTexture, 0);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.sceneRenderBuffer);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }   

    this.pickID = function(mouseX, mouseY) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sceneFramebuffer);
        this.sceneInfo.pickingEnabled = true;

        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camera3D.setProjection();         
        this.boundingBox.draw();
        this.projectGroup.draw();
        this.interfaceGroup.draw();

        var pixels = new Uint8Array(4);
        this.gl.readPixels(mouseX, mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        let pickedID = ConvertRGBToID(pixels[0], pixels[1], pixels[2]);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.sceneInfo.pickingEnabled = false;

        return pickedID;
    }

    this.pickIndex = function(mouseX, mouseY, pickResult) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sceneFramebuffer);
        this.sceneInfo.pickingEnabled = true;

        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camera3D.setProjection();       
        pickResult.Renderable.drawIndex(pickResult.Position);

        var pixels = new Uint8Array(4);
        this.gl.readPixels(mouseX, mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        let pickedID = ConvertRGBToID(pixels[0], pixels[1], pixels[2]);
        var ratio = ConvertColorToFloat(pixels[0], pixels[1], pixels[2]);

        pickResult.Renderable.pickFinal(ratio, pickResult);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.sceneInfo.pickingEnabled = false;

        return pickedID;
    }

    this.pickObject = function(width, height, mouseX, mouseY) {
        if (this.currentWidth !== width || this.currentHeight !== height) {
            this.currentWidth = width;
            this.currentHeight = height;
            this.initSceneTexture(width, height);
        }

        this.camera3D.setPickDirection(mouseX, mouseY);
        let pickedID = this.pickID(mouseX, height - mouseY);

        let pickResult = new PickingResult(0);
        this.projectGroup.tryPicking(pickedID, pickResult);
        this.interfaceGroup.tryPicking(pickedID, pickResult);

        if (pickResult.Status === 2 && pickResult.Renderable !== null) {
            this.pickIndex(mouseX, height - mouseY, pickResult);
        }

        pickResult.PickedID = pickedID;

        return pickResult;
    }

    
    this.draw = function(width, height, isMeterUnit) {

        this.gl.viewportWidth = width;
        this.gl.viewportHeight = height;

        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); 
        this.gl.clearDepth(1.0); 
        this.gl.enable(this.gl.DEPTH_TEST); 
        this.gl.depthFunc(this.gl.LEQUAL); 

        this.camera3D.setProjection();    

        if (isMeterUnit) { 
            this.boundingBox.draw();
        }
        else {
            this.boundingBoxFoot.draw();
        }
        this.projectGroup.draw();
        this.interfaceGroup.draw();

    }
}