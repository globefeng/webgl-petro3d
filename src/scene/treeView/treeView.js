import React, { useContext, useState, useEffect }  from 'react';
import { PetroContext } from '../../context/petroContext';
import { SceneData } from '../../AppData';
import { SceneData2 } from '../../AppData2';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import rightIcon from './right.svg';
import downIcon from './down.svg';

import projectIcon from './project.svg';
import wellIcon from './wellbore.svg';
import perfIcon from './perf.svg';
import geophoneIcon from './geophone.svg';
import lasIcon from './las.svg';
import fractureIcon from './fracture.svg';
import eventIcon from './event.svg';
import checkIcon from './checked.svg';

import './treeView.css';

const TreeView = (props) => {
    const { Token, treeItems, dispatchAction, workingProject } = useContext(PetroContext)
    const [ activeTreeItems, setActiveTreeItems] = useState();
    const [ selectedItem, setSelectedItem] = useState(null);
    const [ deleteInfo, setDeleteInfo ] = useState(null);

    const [projectAnchorEl, setProjectAnchorEl] = React.useState(null);
    const [wellGroupAnchorEl, setWellGroupAnchorEl] = React.useState(null);
    const [eventGroupAnchorEl, setEventGroupAnchorEl] = React.useState(null);
    const [wellAnchorEl, setWellAnchorEl] = React.useState(null);
    const [perfAnchorEl, setPerfAnchorEl] = React.useState(null);
    const [geophoneAnchorEl, setGeophoneAnchorEl] = React.useState(null);
    const [fractureAnchorEl, setFractureAnchorEl] = React.useState(null);
    const [lasAnchorEl, setLasAnchorEl] = React.useState(null);
  
    const [addWellboreDlgOpen, setAddWellboreDlgOpen] = React.useState(false);
    const [addPerforationDlgOpen, setAddPerforationDlgOpen] = React.useState(false);
    const [addGeophoneDlgOpen, setAddGeophoneDlgOpen] = React.useState(false);
    const [addLasDlgOpen, setAddLasDlgOpen] = React.useState(false);
    const [addMSEventsDlgOpen, setAddMSEventsDlgOpen] = React.useState(false);
    const [addFractureDlgOpen, setAddFractureDlgOpen] = React.useState(false);
    const [changeLasDlgOpen, setChangeLasDlgOpen] = React.useState(false);

    const onChecked = (id) => {
        let item = treeItems.find(a => a.id === id);
        if (item !== null) {
            item.checked = !item.checked;
            let activeItems = getActiveItem(treeItems)
            setActiveTreeItems(activeItems); 

            let visibleList = [];
            for (var i = 0; i < treeItems.length; i++) {
                if (treeItems[i].checked) {
                visibleList.push(treeItems[i].id);
                }
            }

            dispatchAction({type: 'SET_TREEVIEW_VISIBLE', data: visibleList})
        }
    }

    const onCollapse = (id) => {
        let item = treeItems.find(a => a.id === id);
        if (item !== null) {
            item.expanded = !item.expanded;
            let activeItems = getActiveItem(treeItems)
            setActiveTreeItems(activeItems);
        }
    }
    
    const onOpenContextMenuMenu = (event, item) => {
        if (item.treeType === 0) { setProjectAnchorEl(event.currentTarget); }             // project
        else if (item.treeType === 1) { setWellGroupAnchorEl(event.currentTarget); }      // Wellgroup 
        else if (item.treeType === 2) { setWellAnchorEl(event.currentTarget); }           // Wellbore 
        else if (item.treeType === 3) { setEventGroupAnchorEl(event.currentTarget); }     // Event Group
        else if (item.treeType === 4) { setEventGroupAnchorEl(event.currentTarget); }     // Event well
        else if (item.treeType === 5) { alert(item.treeType + ' Event') }                      // Event
        else if (item.treeType === 6) { setGeophoneAnchorEl(event.currentTarget);  }      // Geophone
        else if (item.treeType === 7) { setPerfAnchorEl(event.currentTarget); }           // Perf
        else if (item.treeType === 8) { setLasAnchorEl(event.currentTarget); }                        // Las
        else if (item.treeType === 9) { setFractureAnchorEl(event.currentTarget); }              // Plane Group 
        else if (item.treeType === 10) { setFractureAnchorEl(event.currentTarget); }                  // Plane
    }

    const getActiveItem = (items) => {
        if (items === null || items.length < 1) return [];

        let currentDepth = 0;
        let activeItems = [];

        for (var i = 0; i < items.length; i++) {
            if (currentDepth === 0) {
                activeItems.push(items[i]);
                if (!items[i].expanded) {
                    currentDepth = items[i].depth;
                }
            }
            else if (items[i].depth <= currentDepth) {
                activeItems.push(items[i]);
                if (!items[i].expanded) {
                    currentDepth = items[i].depth;
                }
                else {
                    currentDepth = 0;
                }
            }
        }
        return activeItems;
    }

    const getMenuContent = (item) => {
        let typeIcon = undefined;
        if (item.treeType === 0) { typeIcon = projectIcon }
        else if (item.treeType === 1 || item.treeType === 2) { typeIcon = wellIcon }
        else if (item.treeType === 3 || item.treeType === 4 || item.treeType === 5) { typeIcon = eventIcon }
        else if (item.treeType === 6) { typeIcon = geophoneIcon }
        else if (item.treeType === 7) { typeIcon = perfIcon }
        else if (item.treeType === 8) { typeIcon = lasIcon }
        else if (item.treeType === 9 || item.treeType === 10) { typeIcon = fractureIcon }

        return (
            <div className="treeContent" aria-controls="projectMenu" aria-haspopup="true" onClick={e => {
                setSelectedItem(item); onOpenContextMenuMenu(e, item)
            }}>
                <div className="treeIconDiv"><img className="treeIcon" src={typeIcon} alt="icon" /></div>
                <span style={{whiteSpace:"nowrap"}}>{item.name}</span>
            </div>
        );
    }    

    const getItemContent = (item, index) => {
        let collapsedIcon = item.expanded ? rightIcon : downIcon;
        let collapsedItem = item.treeType !== 0 ? <div className="treeArrow" onClick={() => onCollapse(item.id)}>
                            <img className="treeIcon" src={collapsedIcon} alt="collapsed Icon" />
                            </div> : '';
        let checkButton = <div className="treeCheckDiv" onClick={() => {onChecked(item.id)}}>
                {item.checked ? <img className="treeIcon" src={checkIcon} alt="icon" /> : <img className="treeIcon" src={''} alt="" />}
            </div>

        let checkItem = item.depth !== 0 ? checkButton : '';

        return <div key={index} style={{overflow:'hidden'}}>
                   <div className="treeRow">
                        {getEmptySpaces(item)} 
                        {item.hasChildren && collapsedItem } 
                        {checkItem} 
                        {getMenuContent(item)} 
                    </div>
                </div> 
    }

    const reloadWindow = () => {
        props.history.push(`/?id=${workingProject}&data=${Token.split('').reverse().join('')}`);
    };

    const getEmptySpaces = (item) => {
        let levelArray = Array(item.depth).fill(0);

        if (item.hasChildren) 
            return levelArray.map((a, index) => <span key={index}>&nbsp;&nbsp;&nbsp;&nbsp;</span>)   
        else
            return levelArray.map((a, index) => <span key={index}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>)   
     }

    useEffect(() => {
        if (treeItems !== undefined && treeItems !== null) {
            let activeItems = getActiveItem(treeItems);
            setActiveTreeItems(activeItems);
        }
    }, [treeItems])

    const LoadProject = () => {
        dispatchAction({ type: "SET_SCENE_DATA", data: SceneData })
    }
    
    const LoadProject2 = () => {
        dispatchAction({ type: "SET_SCENE_DATA", data: SceneData2 })
    }

    return (
        ( activeTreeItems !== undefined && activeTreeItems !== null) ? 
        <div>
            <div>
            <button onClick={LoadProject} style={{marginRight: '30px'}}>Load Project</button>
            <button onClick={LoadProject2}>Load Project 2</button>
            </div>
        {activeTreeItems.map((item, index) => getItemContent(item, index))}

        {/* <Menu
            id="projectMenu"
            anchorEl={projectAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(projectAnchorEl)}
            onClose={() => setProjectAnchorEl(null)}
            >
            <MenuItem onClick={()=> {setProjectAnchorEl(null); setAddWellboreDlgOpen(true); }}>Add Wellbore</MenuItem>
            <MenuItem onClick={() => {setProjectAnchorEl(null); setAddMSEventsDlgOpen(true);}}>Add MicroSeismic Events</MenuItem>
            <MenuItem onClick={() => {setProjectAnchorEl(null); setAddFractureDlgOpen(true);}}>Add Fracture Data</MenuItem>
        </Menu> 

        <Menu
            id="eventGroupMenu"
            anchorEl={eventGroupAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(eventGroupAnchorEl)}
            onClose={() => setEventGroupAnchorEl(null)}
            >
            <MenuItem onClick={() => {setEventGroupAnchorEl(null); setAddMSEventsDlgOpen(true);}}>Add MicroSeismic Events</MenuItem>
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "events", content: 'all events'}); setEventGroupAnchorEl(null)}}>Remove MicroSeismic Events</MenuItem>
        </Menu> 

        <Menu
            id="wellGroupMenu"
            anchorEl={wellGroupAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(wellGroupAnchorEl)}
            onClose={() => setWellGroupAnchorEl(null)}
            >
            <MenuItem onClick={()=> {setWellGroupAnchorEl(null); setAddWellboreDlgOpen(true); }}>Add Wellbore</MenuItem>
        </Menu> 

        <Menu
            id="wellMenu"
            anchorEl={wellAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(wellAnchorEl)}
            onClose={() => setWellAnchorEl(null)}
            >
            <MenuItem onClick={() => {setWellAnchorEl(null); setAddLasDlgOpen(true); }}>Add Las</MenuItem>
            <MenuItem onClick={() => {setWellAnchorEl(null); setAddPerforationDlgOpen(true); }}>Add Perf</MenuItem>
            <MenuItem onClick={() => {setWellAnchorEl(null); setAddGeophoneDlgOpen(true); }}>Add Geophone</MenuItem>
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "wellbore", content: selectedItem.name}); setWellAnchorEl(null)}}>Remove this wellbore</MenuItem>
        </Menu> 

        <Menu
            id="perfMenu"
            anchorEl={perfAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(perfAnchorEl)}
            onClose={() => setPerfAnchorEl(null)}
            >
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "perf", content: selectedItem.name}); setPerfAnchorEl(null)}}>Remove this perf</MenuItem>
        </Menu>         

        <Menu
            id="geophoneMenu"
            anchorEl={geophoneAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(geophoneAnchorEl)}
            onClose={() => setGeophoneAnchorEl(null)}
            >
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "geophone", content: selectedItem.name}); setGeophoneAnchorEl(null)}}>Remove this geophone</MenuItem>
        </Menu>    

        <Menu
            id="lasMenu"
            anchorEl={lasAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(lasAnchorEl)}
            onClose={() => setLasAnchorEl(null)}
            >
            <MenuItem onClick={() => {setLasAnchorEl(null); setChangeLasDlgOpen(true);}}>Change las channel</MenuItem>
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "las", content: selectedItem.name}); setLasAnchorEl(null)}}>Remove this las</MenuItem>
        </Menu> 

        <Menu
            id="fractureMenu"
            anchorEl={fractureAnchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom" }}
            transformOrigin={{ vertical: "top" }}
            keepMounted
            open={Boolean(fractureAnchorEl)}
            onClose={() => setFractureAnchorEl(null)}
            >
            <MenuItem onClick={() => {setDeleteInfo({open: true, type: "fracture", content: selectedItem.name}); setFractureAnchorEl(null)}}>Remove fracture data</MenuItem>
        </Menu>                */}

        </div> : <div></div>
    )
    
}

export default TreeView;
