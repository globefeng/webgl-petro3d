import React, { useContext } from "react";
import { makeStyles } from '@material-ui/core/styles';
import {List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import { PetroContext } from '../../context/petroContext';

const useStyles = makeStyles(theme => ({
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
    title: {
        paddingTop: theme.spacing(0),
        paddingBottom: theme.spacing(0),
        marginTop: theme.spacing(2), 
        backgroundColor: "lightgreen"       
      },
    nested: {
        marginLeft: theme.spacing(0),
        marginRight: theme.spacing(0),
        paddingTop: theme.spacing(0),
        paddingBottom: theme.spacing(0),
        borderBottom: '1px solid lightgray'
    },
    colorText: {
        backgroundColor: "#3F51B5",
        color: "#FFFFFF"
    }
    }));


const InfoComponent = () => {
    const classes = useStyles();
    const { objectInfo } = useContext(PetroContext)

    return (
        <List aria-labelledby="nested-list-subheader" className={classes.root} >
            <List component="div" disablePadding>
            {objectInfo.map((item, index) => {
                return <ListItem key={index} button className={item.value === '' ? [classes.nested, classes.colorText] : classes.nested} > 
                <ListItemText primary={item.name}  />
                <ListItemSecondaryAction >{item.value}</ListItemSecondaryAction>
                </ListItem>
            })}
            </List>
        </List>
    )
}

export default InfoComponent;
