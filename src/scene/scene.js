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
import { StageEvents, EventItem } from './petroObject/microEventStage';
import { ConvertRGBToID, PickingResult, ConvertColorToFloat } from './sceneConsts';

import TreeViewItem from './treeView/treeViewItem';

export function Scene() {
    this.currentWidth = 1;
    this.currentHeight = 1;
    this.sceneFramebuffer = null; 
    this.sceneRenderBuffer = null;
    this.treeViewItems = [];

    this.init = function(gl, sceneData) {
        this.gl = gl;
        let shaderProgram = initShaderProgram(this.gl);

        this.localTangentPlane = new LocalTangentPlane();
        this.localTangentPlane.init(0, 0, 0);
    
        this.sceneInfo = new SceneInfo();
        this.sceneInfo.init(this.gl, shaderProgram, this.localTangentPlane);

        this.geoLocation = sceneData.LTPOrig;

        this.boundingBox = new BoundingBox(this.sceneInfo);
        this.boundingBox.init(sceneData.BoundMinMeter.X, sceneData.BoundMinMeter.Y, sceneData.BoundMinMeter.Z,
            sceneData.BoundMaxMeter.X, sceneData.BoundMaxMeter.Y, sceneData.BoundMaxMeter.Z,
            sceneData.GridSizeMeter);

        this.boundingBoxFoot = new BoundingBox(this.sceneInfo);    
        this.boundingBoxFoot.init(sceneData.BoundMinFoot.X / 3.2808399, 
                                              sceneData.BoundMinFoot.Y / 3.2808399, 
                                              sceneData.BoundMinFoot.Z / 3.2808399,
                                              sceneData.BoundMaxFoot.X / 3.2808399, 
                                              sceneData.BoundMaxFoot.Y / 3.2808399, 
                                              sceneData.BoundMaxFoot.Z / 3.2808399,
                                              sceneData.GridSizeFoot / 3.2808399);

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

        if (sceneData.WellGroup !== undefined && sceneData.WellGroup !== null && 
            sceneData.WellGroup.Wellbores !== undefined && sceneData.WellGroup.Wellbores !== null) 
        {
            let wellGroup = new RenderableGroup(sceneData.WellGroup.Name, sceneData.WellGroup.ID, this.sceneInfo);
            this.projectGroup.addChild(wellGroup);

            let wellGroupNode = new TreeViewItem();
            wellGroupNode.id = sceneData.WellGroup.ID;
            wellGroupNode.name = sceneData.WellGroup.Name;
            wellGroupNode.treeType = 1;
            wellGroupNode.depth = 1;        
            wellGroupNode.hasChildren = true;
            this.treeViewItems.push(wellGroupNode);
    
            for (var i = 0; i < sceneData.WellGroup.Wellbores.length; i++) {
                let wellbore = new Wellbore(this.sceneInfo);
                let wellboreData = sceneData.WellGroup.Wellbores[i];

                let wellboreNode = new TreeViewItem();
                wellboreNode.id = wellboreData.ID;
                wellboreNode.name = wellboreData.Name;
                wellboreNode.treeType = 2;    
                wellboreNode.depth = 2;        
                wellboreNode.hasChildren = true;
                this.treeViewItems.push(wellboreNode);

                let wellData = [];
                for (var j = 0; j < wellboreData.JointPoints.length; j++) {
                    var p = wellboreData.JointPoints[j];
                    wellData.push([p.X, p.Y, p.Z]);
                }
        
                wellbore.init(wellboreData.Name, wellboreData.ID, 10, wellData, 
                    [wellboreData.Color.X, wellboreData.Color.Y, wellboreData.Color.Z]);

                if (wellboreData.GeophoneGroup !== null && wellboreData.GeophoneGroup.GeophoneCollection !== undefined) {
                    let geophoneGroup = new RenderableGroup(wellboreData.GeophoneGroup.Name, wellboreData.GeophoneGroup.ID, this.sceneInfo);
                    wellbore.addChild(geophoneGroup);

                    let geophoneNode = new TreeViewItem();
                    geophoneNode.id = wellboreData.GeophoneGroup.ID;
                    geophoneNode.name = wellboreData.GeophoneGroup.Name;
                    geophoneNode.treeType = 6;    
                    geophoneNode.depth = 3;        
                    geophoneNode.hasChildren = false;
                    this.treeViewItems.push(geophoneNode);

                    let geophoneCollection = wellboreData.GeophoneGroup.GeophoneCollection;
                    for (var k = 0; k < geophoneCollection.length; k++) {
                        var geophoneObject = geophoneCollection[k];

                        var geophoneRenderable = new Geophone(this.sceneInfo);
                        geophoneRenderable.init(wellbore, geophoneObject.Name);                       

                        var geophoneData = [];
                        for (var m = 0; m < geophoneObject.Distances.length; m++) {
                            geophoneData.push(geophoneObject.Distances[m]);
                        }

                        geophoneRenderable.setData(geophoneData);
                        geophoneGroup.addChild(geophoneRenderable);
                    }
                }

                if (wellboreData.PerfGroup !== null && wellboreData.PerfGroup.PerfCollection !== undefined ) {
                    let perfGroup = new RenderableGroup(wellboreData.PerfGroup.Name, wellboreData.PerfGroup.ID, this.sceneInfo);
                    wellbore.addChild(perfGroup);

                    let perfNode = new TreeViewItem();
                    perfNode.id = wellboreData.PerfGroup.ID;
                    perfNode.name = wellboreData.PerfGroup.Name;
                    perfNode.treeType = 7;    
                    perfNode.depth = 3;        
                    perfNode.hasChildren = false;
                    this.treeViewItems.push(perfNode);  

                    for (var ii = 0; ii < wellboreData.PerfGroup.PerfCollection.length; ii++) {
                        var perfObject = wellboreData.PerfGroup.PerfCollection[ii];

                        var perfRenderable = new Perf(this.sceneInfo);
                        perfRenderable.init(wellbore, perfObject.Name, perfObject.Color);

                        var perfData = [];
                        for (var jj = 0; jj < perfObject.Distances.length; jj++) {
                            perfData.push(perfObject.Distances[jj]);
                        }
                        perfRenderable.setData(perfData);
                        perfGroup.addChild(perfRenderable);
                    }
                }            

                if (wellboreData.LasLog != null) {
                    var lasRenderable = new LasLog(this.sceneInfo);
                    lasRenderable.init(wellbore, wellboreData.LasLog);
                    
                    let lasName = lasRenderable.changeChannel('GR');

                    let lasNode = new TreeViewItem();
                    lasNode.id = wellboreData.LasLog.ID;
                    lasNode.name = lasName;
                    lasNode.treeType = 8;    
                    lasNode.depth = 3;        
                    lasNode.hasChildren = false;
                    lasNode.data = wellboreData.LasLog.NameList;
                    lasNode.renderable = lasRenderable;
                    this.treeViewItems.push(lasNode);  

                    wellbore.addChild(lasRenderable);
                }

                wellGroup.addChild(wellbore);    
            }
        }

        if (sceneData.EventGroup && sceneData.EventGroup.EventWellCollection) {
            let eventGroup = new RenderableGroup(sceneData.EventGroup.Name, sceneData.EventGroup.ID, this.sceneInfo);            
            this.projectGroup.addChild(eventGroup);

            let eventGroupNode = new TreeViewItem();
            eventGroupNode.id = sceneData.EventGroup.ID;
            eventGroupNode.name = sceneData.EventGroup.Name;
            eventGroupNode.treeType = 3;    
            eventGroupNode.depth = 1;        
            eventGroupNode.hasChildren = true;
            this.treeViewItems.push(eventGroupNode);               

            for (var i3 = 0; i3 < sceneData.EventGroup.EventWellCollection.length; i3++) {
                let eventWellObject = sceneData.EventGroup.EventWellCollection[i3];

                var renderableWellEventGroup = new RenderableGroup(eventWellObject.Name, eventWellObject.ID, this.sceneInfo);
                eventGroup.addChild(renderableWellEventGroup);

                let eventWellNode = new TreeViewItem();
                eventWellNode.id = eventWellObject.ID;
                eventWellNode.name = eventWellObject.Name;
                eventWellNode.treeType = 4;    
                eventWellNode.depth = 2;        
                eventWellNode.hasChildren = true;
                this.treeViewItems.push(eventWellNode);                 

                for (var k3 = 0; k3 < eventWellObject.StageCollection.length; k3++) {
                    var stageObject = eventWellObject.StageCollection[k3];

                    let eventList = []
                    for (var kk3 = 0; kk3 < stageObject.EventCollection.length; kk3++) {
                        var eItem = stageObject.EventCollection[kk3];
                        eventList.push(new EventItem([eItem.X, eItem.Y, eItem.Z], eItem.M, eItem.C, eItem.T));
                    }

                    var stageEvents = new StageEvents(this.sceneInfo);
                    stageEvents.init(stageObject.Name, stageObject.ID, [stageObject.Color.X, stageObject.Color.Y, stageObject.Color.Z]);
                    stageEvents.setupEventBuffer(eventList);
                    renderableWellEventGroup.addChild(stageEvents);

                    let eventStageNode = new TreeViewItem();
                    eventStageNode.id = stageObject.ID;
                    eventStageNode.name = stageObject.Name;
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